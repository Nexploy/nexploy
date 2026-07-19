import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    environmentIdSchema,
    environmentSchema,
} from '@workspace/schemas-zod/docker/environment/environment.schema';
import {
    createEnvironment,
    deleteEnvironment,
    getUserEnvironments,
    setDefaultEnvironmentById,
    updateEnvironment,
} from '@/services/environment/environment.service';
import { fail, guard, guardDestructive, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';
import { z } from 'zod';

export const environmentsGroup: ToolGroup = {
    name: 'environments',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowEnvironmentsGroup === false) return;

        server.registerTool(
            'listEnvironments',
            {
                description:
                    'List all configured Docker environments. Shows which one is currently active for this session and which is the global default.',
            },
            async () => {
                const g = guard(ctx, 'environment', 'read');
                if (g) return g;
                try {
                    const envs = await getUserEnvironments(ctx.userId);
                    const data = envs.map((e) => ({
                        id: e.id,
                        name: e.name,
                        connectionType: e.connectionType,
                        isDefault: e.isDefault,
                        isActiveInSession: e.id === ctx.environmentId,
                        healthStatus: e.healthStatus,
                        description: e.description,
                    }));
                    return ok(
                        JSON.stringify({
                            count: data.length,
                            activeSessionEnvironmentId: ctx.environmentId ?? null,
                            data,
                        }),
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'useEnvironment',
            {
                description:
                    'Switch the active Docker environment for this MCP session. All subsequent Docker operations (containers, images, volumes, networks, etc.) will target this environment. Use listEnvironments first to get available IDs.',
                inputSchema: z.object({
                    environmentId: z
                        .string()
                        .describe('ID of the environment to use for this session'),
                }).shape,
            },
            async ({ environmentId }) => {
                const g = guard(ctx, 'environment', 'read');
                if (g) return g;
                try {
                    const envs = await getUserEnvironments(ctx.userId);
                    const target = envs.find((e) => e.id === environmentId);
                    if (!target) {
                        return fail(
                            `Environment "${environmentId}" not found. Available: ${envs.map((e) => `${e.name} (${e.id})`).join(', ')}`,
                        );
                    }
                    ctx.environmentId = environmentId;
                    return ok(
                        `Now using environment "${target.name}" (${environmentId}) for this session.`,
                    );
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createEnvironment',
            {
                description: 'Add a new Docker environment (local socket, TCP, or TCP with TLS).',
                inputSchema: environmentSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'environment', 'create');
                if (g) return g;
                try {
                    const env = await createEnvironment(params, ctx.userId);
                    return ok(`Environment "${env.name}" created (ID: ${env.id})`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'updateEnvironment',
            {
                description: 'Update an existing Docker environment configuration.',
                inputSchema: environmentSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'environment', 'update');
                if (g) return g;
                try {
                    const env = await updateEnvironment(params);
                    return ok(`Environment "${env.name}" updated`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'setDefaultEnvironment',
            {
                description: 'Set a Docker environment as the default for all operations.',
                inputSchema: environmentIdSchema.shape,
            },
            async ({ environmentId }) => {
                const g = guard(ctx, 'environment', 'update');
                if (g) return g;
                try {
                    await setDefaultEnvironmentById(environmentId);
                    return ok(`Environment set as default`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteEnvironment',
            {
                description: 'Remove a Docker environment by ID.',
                inputSchema: environmentIdSchema.shape,
            },
            async ({ environmentId }) => {
                const g = guardDestructive(ctx, 'environment', 'delete', environmentId);
                if (g) return g;
                try {
                    await deleteEnvironment(environmentId);
                    return ok(`Environment deleted`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
