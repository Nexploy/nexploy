import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { getActor } from '@/middleware/auth.middleware';
import type { EnvironmentProtectedAction } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';

interface ProtectionRule {
    methods: string[];
    pattern: RegExp;
    action: EnvironmentProtectedAction;
}

const rules: ProtectionRule[] = [
    { methods: ['POST'], pattern: /^\/api\/container\/(create|run-ephemeral)$/, action: 'container.create' },
    { methods: ['POST'], pattern: /^\/api\/container\/[^/]+\/exec$/, action: 'container.exec' },
    { methods: ['GET'], pattern: /^\/ws\/docker\/(terminal|attach)\/.+$/, action: 'container.exec' },
    {
        methods: ['POST'],
        pattern: /^\/api\/container\/(recreate|rename|restart-policy)$/,
        action: 'container.update',
    },
    { methods: ['POST'], pattern: /^\/api\/container\/migrate$/, action: 'container.migrateOut' },
    {
        methods: ['POST'],
        pattern: /^\/api\/container\/(start|stop|pause|unpause|restart)$/,
        action: 'container.lifecycle',
    },
    { methods: ['DELETE'], pattern: /^\/api\/container\/remove$/, action: 'container.remove' },
    { methods: ['POST'], pattern: /^\/api\/containers\/prune$/, action: 'container.remove' },

    { methods: ['POST'], pattern: /^\/api\/images\/(pull|import|load)$/, action: 'image.pull' },
    { methods: ['POST'], pattern: /^\/api\/images\/(push|tag|untag|save|mirror)$/, action: 'image.manage' },
    { methods: ['POST'], pattern: /^\/api\/images\/[^/]+\/tag$/, action: 'image.manage' },
    { methods: ['POST'], pattern: /^\/api\/images\/(delete|prune)$/, action: 'image.remove' },

    { methods: ['POST'], pattern: /^\/api\/volumes\/(create|cache\/restore|cache\/save)$/, action: 'volume.manage' },
    { methods: ['POST'], pattern: /^\/api\/volumes\/(delete|prune)$/, action: 'volume.remove' },

    { methods: ['POST'], pattern: /^\/api\/networks\/create$/, action: 'network.manage' },
    { methods: ['POST'], pattern: /^\/api\/networks\/(delete|prune)$/, action: 'network.remove' },

    {
        methods: ['POST', 'PATCH', 'DELETE'],
        pattern: /^\/api\/swarm\/(nodes|services)(\/.*)?$/,
        action: 'swarm.manage',
    },
    { methods: ['POST'], pattern: /^\/api\/swarm\/(init|join|leave)$/, action: 'swarm.manage' },

    {
        methods: ['POST'],
        pattern: /^\/api\/system\/(prune\/[^/]+|build-cache\/prune)$/,
        action: 'maintenance.cleanup',
    },

    { methods: ['POST'], pattern: /^\/api\/composes\/deploy$/, action: 'deployment.deploy' },
    { methods: ['POST'], pattern: /^\/api\/composes\/migrate$/, action: 'container.migrateOut' },
    {
        methods: ['POST'],
        pattern: /^\/api\/composes\/[^/]+\/(start|stop|pause|unpause|restart)$/,
        action: 'container.lifecycle',
    },
    { methods: ['POST'], pattern: /^\/api\/composes\/[^/]+\/remove$/, action: 'container.remove' },

    { methods: ['POST'], pattern: /^\/api\/pipeline\/(deploy|deploy-compose)$/, action: 'deployment.deploy' },
    {
        methods: ['POST'],
        pattern: /^\/api\/pipeline\/events\/stream\/(build|compose|compose-build|compose-run|compose-up)$/,
        action: 'deployment.deploy',
    },
    { methods: ['POST'], pattern: /^\/api\/pipeline\/events\/stream\/push$/, action: 'image.manage' },
];

function matchRule(method: string, path: string): ProtectionRule | undefined {
    return rules.find((rule) => rule.methods.includes(method) && rule.pattern.test(path));
}

function isBlocked(environmentId: string, action: EnvironmentProtectedAction, role: string): string | null {
    const config = dockerClientRegistry.getEnvironmentConfig(environmentId);

    if (!config?.isProtected) return null;
    if (!config.protectedActions?.includes(action)) return null;
    if (role === 'admin' && config.allowAdminBypass !== false) return null;

    return config.name;
}

async function readTargetEnvironmentId(c: Context): Promise<string | undefined> {
    try {
        const body = await c.req.raw.clone().json();
        const targetEnvironmentId = (body as { targetEnvironmentId?: unknown })?.targetEnvironmentId;
        return typeof targetEnvironmentId === 'string' ? targetEnvironmentId : undefined;
    } catch {
        return undefined;
    }
}

export async function environmentProtectionMiddleware(c: Context, next: Next) {
    const rule = matchRule(c.req.method, c.req.path);

    if (!rule) return next();

    const environmentId = getCurrentEnvironmentId() ?? dockerClientRegistry.getDefaultEnvironmentId();

    if (!environmentId) return next();

    const role = getActor(c).role ?? '';

    const blockedOn = isBlocked(environmentId, rule.action, role);

    if (blockedOn) {
        logger.warn(
            { environmentId, action: rule.action, path: c.req.path, role },
            'Blocked by environment protection',
        );
        return c.json(
            {
                error: `Environment "${blockedOn}" is protected: action "${rule.action}" is blocked.`,
                code: 'ENVIRONMENT_PROTECTED',
                action: rule.action,
                environmentId,
            },
            403,
        );
    }

    if (rule.action === 'container.migrateOut') {
        const targetEnvironmentId = await readTargetEnvironmentId(c);

        if (targetEnvironmentId) {
            const blockedOnTarget = isBlocked(targetEnvironmentId, 'container.migrateIn', role);

            if (blockedOnTarget) {
                logger.warn({ targetEnvironmentId, role }, 'Blocked by environment protection on migration target');
                return c.json(
                    {
                        error: `Environment "${blockedOnTarget}" is protected: action "container.migrateIn" is blocked.`,
                        code: 'ENVIRONMENT_PROTECTED',
                        action: 'container.migrateIn',
                        environmentId: targetEnvironmentId,
                    },
                    403,
                );
            }
        }
    }

    return next();
}
