import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    environmentIdSchema,
    environmentSchema,
} from '@workspace/schemas-zod/docker/environment/environment.schema';
import {
    getUserEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setDefaultEnvironmentById,
} from '@/services/environment/environment.service';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const environmentsGroup: ToolGroup = {
    name: 'environments',

    register(server: McpServer, ctx: ToolContext) {
        server.registerTool(
            'listEnvironments',
            { description: 'List all configured Docker environments.' },
            async () => {
                const g = guard(ctx, 'environment', 'read');
                if (g) return g;
                try {
                    const envs = await getUserEnvironments();
                    const data = envs.map((e) => ({
                        id: e.id,
                        name: e.name,
                        connectionType: e.connectionType,
                        isDefault: e.isDefault,
                        description: e.description,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
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
                const g = guard(ctx, 'environment', 'delete');
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
