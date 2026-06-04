import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    createRegistrySchema,
    deleteRegistrySchema,
    updateRegistrySchema,
} from '@workspace/schemas-zod/registry/registry.schema';
import { getRegistries, createRegistry, updateRegistry, deleteRegistry } from '@/services/registry.service';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const registriesGroup: ToolGroup = {
    name: 'registries',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowRegistriesGroup === false) return;

        server.registerTool(
            'listRegistries',
            { description: 'List all configured Docker registries.' },
            async () => {
                const g = guard(ctx, 'registry', 'read');
                if (g) return g;
                try {
                    const registries = await getRegistries();
                    const data = registries.map((r) => ({
                        id: r.id,
                        name: r.name,
                        url: r.url,
                        username: r.username,
                        createdAt: r.createdAt,
                    }));
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createRegistry',
            {
                description: 'Add a new Docker registry. Requires admin role.',
                inputSchema: createRegistrySchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'registry', 'create');
                if (g) return g;
                try {
                    const registry = await createRegistry(params);
                    return ok(`Registry "${registry.name}" created (ID: ${registry.id})`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'updateRegistry',
            {
                description: 'Update an existing Docker registry. Requires admin role.',
                inputSchema: updateRegistrySchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'registry', 'update');
                if (g) return g;
                try {
                    const registry = await updateRegistry(params);
                    return ok(`Registry "${registry.name}" updated`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteRegistry',
            {
                description: 'Remove a Docker registry. Requires admin role.',
                inputSchema: deleteRegistrySchema.shape,
            },
            async ({ id }) => {
                const g = guard(ctx, 'registry', 'delete');
                if (g) return g;
                try {
                    await deleteRegistry(id);
                    return ok(`Registry deleted`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
