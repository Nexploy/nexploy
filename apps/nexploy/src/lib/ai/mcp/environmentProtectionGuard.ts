import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { EnvironmentProtectedAction } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';
import {
    getEnvironmentProtection,
    isEnvironmentActionBlocked,
} from '@/services/environment/environmentProtection.service';
import type { ToolContext } from './types';

type ProtectionRule = EnvironmentProtectedAction | ((args: any) => EnvironmentProtectedAction | null);

const protectionRules: Record<string, ProtectionRule> = {
    containerAction: (args) => (args?.action === 'remove' ? 'container.remove' : 'container.lifecycle'),
    pauseContainer: 'container.lifecycle',
    unpauseContainer: 'container.lifecycle',
    renameContainer: 'container.update',
    recreateContainer: 'container.update',
    createContainer: 'container.create',
    execInContainer: 'container.exec',
    pullImage: 'image.pull',
    tagImage: 'image.manage',
    deleteImages: 'image.remove',
    pruneImages: 'image.remove',
    createNetwork: 'network.manage',
    deleteNetworks: 'network.remove',
    createVolume: 'volume.manage',
    deleteVolumes: 'volume.remove',
    pruneVolumes: 'volume.remove',
    initSwarm: 'swarm.manage',
    leaveSwarm: 'swarm.manage',
    swarmNodeAction: 'swarm.manage',
    createSwarmService: 'swarm.manage',
    scaleSwarmService: 'swarm.manage',
    removeSwarmServices: 'swarm.manage',
    deployCompose: 'deployment.deploy',
    composeAction: 'deployment.deploy',
    triggerRepositoryBuild: 'deployment.deploy',
    updateEnvironment: 'environment.update',
    setDefaultEnvironment: 'environment.update',
    deleteEnvironment: 'environment.delete',
};

function resolveAction(rule: ProtectionRule, args: unknown): EnvironmentProtectedAction | null {
    return typeof rule === 'function' ? rule(args) : rule;
}

export function withEnvironmentProtection(server: McpServer, ctx: ToolContext): McpServer {
    return new Proxy(server, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);

            if (property !== 'registerTool' || typeof value !== 'function') {
                return typeof value === 'function' ? value.bind(target) : value;
            }

            return (name: string, config: unknown, handler: (...args: any[]) => any) => {
                const rule = protectionRules[name];

                if (!rule) return value.call(target, name, config, handler);

                const guardedHandler = async (...args: any[]) => {
                    const action = resolveAction(rule, args[0]);
                    const environmentId = ctx.environmentId;

                    if (action && environmentId) {
                        const protection = await getEnvironmentProtection(environmentId).catch(() => null);

                        if (isEnvironmentActionBlocked(protection, action, ctx.role)) {
                            return {
                                content: [
                                    {
                                        type: 'text' as const,
                                        text: `Error: environment "${protection!.name}" is protected, action "${action}" is blocked`,
                                    },
                                ],
                                isError: true,
                            };
                        }
                    }

                    return handler(...args);
                };

                return value.call(target, name, config, guardedHandler);
            };
        },
    });
}
