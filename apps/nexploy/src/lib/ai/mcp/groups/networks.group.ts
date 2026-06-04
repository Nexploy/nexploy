import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    networkCreateSchema,
    networkDeleteSchema,
} from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const networksGroup: ToolGroup = {
    name: 'networks',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowNetworksGroup === false) return;

        server.registerTool(
            'listNetworks',
            { description: 'List all Docker networks.' },
            async () => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const networks = await kyDocker.get('networks').json<any[]>();
                    const data = networks.map((n) => ({
                        id: n.id?.slice(0, 12),
                        name: n.name,
                        driver: n.driver,
                        scope: n.scope,
                    }));
                    return ok(JSON.stringify({ count: networks.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'inspectNetwork',
            {
                description: 'Get full inspection details of a Docker network.',
                inputSchema: z.object({ id: z.string().describe('Network ID or name') }).shape,
            },
            async ({ id }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker.get(`networks/${id}`).json();
                    return ok(JSON.stringify(data));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createNetwork',
            {
                description: 'Create a Docker network.',
                inputSchema: networkCreateSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post('networks/create', { json: params }).json();
                    return ok(`Network \`${params.name}\` created`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteNetworks',
            {
                description: 'Delete one or more Docker networks by ID.',
                inputSchema: networkDeleteSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post('networks/delete', { json: params }).json();
                    return ok(`Deleted ${params.networkIds.length} network(s)`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
