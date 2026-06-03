import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kyDocker } from '@/lib/api/kyDocker';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

const composeActionSchema = z.object({
    stackName: z.string().min(1).describe('Docker Compose stack/project name'),
    action: z.enum(['start', 'stop', 'restart', 'pause', 'unpause', 'down', 'rebuild']).describe(
        'Action to perform. "down" removes containers. "rebuild" rebuilds images.',
    ),
});

export const composeGroup: ToolGroup = {
    name: 'compose',

    register(server: McpServer, ctx: ToolContext) {
        server.registerTool(
            'listComposeContainers',
            {
                description: 'List all containers belonging to a Docker Compose stack.',
                inputSchema: z.object({ stackName: z.string().describe('Compose stack/project name') }).shape,
            },
            async ({ stackName }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker.get(`compose/${stackName}/list`).json<any[]>();
                    return ok(JSON.stringify({ count: data.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'validateComposeSyntax',
            {
                description: 'Validate the syntax of a Docker Compose YAML string.',
                inputSchema: z.object({ yaml: z.string().describe('Docker Compose YAML content') }).shape,
            },
            async ({ yaml }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('compose/validate-syntax', { json: { yaml } })
                        .json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'composeAction',
            {
                description:
                    'Perform an action on a Docker Compose stack: start, stop, restart, pause, unpause, down, or rebuild.',
                inputSchema: composeActionSchema.shape,
            },
            async ({ stackName, action }) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post(`compose/${stackName}/${action}`).json();
                    return ok(`Stack "${stackName}" — ${action} completed`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
