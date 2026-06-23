import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    volumeCreateSchema,
    volumeDeleteSchema,
} from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const volumesGroup: ToolGroup = {
    name: 'volumes',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowVolumesGroup === false) return;

        server.registerTool(
            'listVolumes',
            { description: 'List all Docker volumes.' },
            async () => {
                const g = guard(ctx, 'volume', 'read');
                if (g) return g;
                try {
                    const volumes = await kyDocker
                        .get('volumes', { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json<any[]>();
                    const data = volumes.map((v) => ({ name: v.name, driver: v.driver }));
                    return ok(JSON.stringify({ count: volumes.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'inspectVolume',
            {
                description: 'Get full inspection details of a Docker volume.',
                inputSchema: z.object({ name: z.string().describe('Volume name') }).shape,
            },
            async ({ name }) => {
                const g = guard(ctx, 'volume', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get(`volumes/${name}/inspect`, {
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(JSON.stringify(data));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createVolume',
            {
                description: 'Create a Docker volume.',
                inputSchema: volumeCreateSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'volume', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post('volumes/create', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Volume \`${params.name}\` created`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteVolumes',
            {
                description: 'Delete one or more Docker volumes by name.',
                inputSchema: volumeDeleteSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'volume', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post('volumes/delete', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Deleted ${params.volumeNames.length} volume(s)`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'pruneVolumes',
            { description: 'Remove all unused Docker volumes. Requires admin role.' },
            async () => {
                const g = guard(ctx, 'volume', 'remove');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('volumes/prune', {
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
