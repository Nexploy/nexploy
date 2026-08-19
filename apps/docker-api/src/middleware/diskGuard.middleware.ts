import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { getDiskGuardSettings } from '@/lib/diskGuardSettings';
import { readHostDiskUsage, resolveDiskGuardLevel } from '@/lib/diskSpace';

const GUARDED_ROUTES: { methods: string[]; pattern: RegExp }[] = [
    { methods: ['POST'], pattern: /^\/api\/container\/(create|run-ephemeral|recreate|migrate)$/ },
    { methods: ['POST'], pattern: /^\/api\/images\/(pull|import|load|mirror)$/ },
    { methods: ['POST'], pattern: /^\/api\/volumes\/(create|cache\/restore)$/ },
    { methods: ['POST'], pattern: /^\/api\/backups\/restore\/[^/]+$/ },
    { methods: ['POST'], pattern: /^\/api\/composes\/(deploy|migrate)$/ },
    { methods: ['POST'], pattern: /^\/api\/pipeline\/(deploy|deploy-compose)$/ },
    { methods: ['POST'], pattern: /^\/api\/pipeline\/events\/stream\/(build|compose)$/ },
    { methods: ['POST'], pattern: /^\/api\/swarm\/services$/ },
];

function isGuarded(method: string, path: string): boolean {
    return GUARDED_ROUTES.some((rule) => rule.methods.includes(method) && rule.pattern.test(path));
}

export async function diskGuardMiddleware(c: Context, next: Next) {
    if (!isGuarded(c.req.method, c.req.path)) return next();

    const settings = await getDiskGuardSettings();

    if (!settings.enabled) return next();

    const usage = await readHostDiskUsage();
    const level = resolveDiskGuardLevel(usage, settings);

    if (level !== 'block') return next();

    logger.warn(
        { path: c.req.path, usedPercent: usage.usedPercent, freeBytes: usage.freeBytes },
        'Blocked by the disk guard: not enough free disk space',
    );

    return c.json(
        {
            error:
                `Not enough free disk space: ${usage.usedPercent}% used, ` +
                `${Math.round(usage.freeBytes / 1024 / 1024)} MB free. ` +
                'Free space or raise the disk guard threshold in the admin settings.',
            code: 'DISK_SPACE_LOW',
            usedPercent: usage.usedPercent,
            freeBytes: usage.freeBytes,
            blockPercent: settings.blockPercent,
            minFreeMb: settings.minFreeMb,
        },
        507,
    );
}
