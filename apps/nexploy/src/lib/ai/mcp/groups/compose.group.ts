import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    composeActionMcpSchema,
    composeStackNameMcpSchema,
    deployComposeSchema,
    validateComposeSyntaxMcpSchema,
} from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const composeGroup: ToolGroup = {
    name: 'compose',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowComposeGroup === false) return;

        server.registerTool(
            'listComposeStacks',
            {
                description:
                    'List all Docker Compose stacks/projects running on this host, with container counts and service names.',
            },
            async () => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker.get('composes').json<any[]>();
                    return ok(JSON.stringify({ count: data.length, stacks: data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'getComposeStatus',
            {
                description:
                    'Get the detailed status of a Docker Compose stack: per-service container list, states, and totals.',
                inputSchema: composeStackNameMcpSchema.shape,
            },
            async ({ stackName }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker.get(`composes/${stackName}/status`).json<any>();
                    return ok(JSON.stringify(data));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'listComposeContainers',
            {
                description: 'List all containers belonging to a Docker Compose stack.',
                inputSchema: composeStackNameMcpSchema.shape,
            },
            async ({ stackName }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker.get(`composes/${stackName}/list`).json<any[]>();
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
                inputSchema: validateComposeSyntaxMcpSchema.shape,
            },
            async ({ yaml }) => {
                const g = guard(ctx, 'docker', 'read');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('composes/validate-syntax', { json: { content: yaml } })
                        .json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deployCompose',
            {
                description:
                    'Deploy a Docker Compose stack from a YAML string. Creates or updates the stack using `docker compose up -d`.',
                inputSchema: deployComposeSchema.shape,
            },
            async ({ projectName, yaml }) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('composes/deploy', { json: { projectName, yaml } })
                        .json<any>();
                    return ok(`Stack "${projectName}" deployed. Logs: ${(result.logs ?? []).slice(-3).join(' | ')}`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'composeAction',
            {
                description:
                    'Perform an action on a Docker Compose stack: start, stop, restart, pause, unpause, or remove.',
                inputSchema: composeActionMcpSchema.shape,
            },
            async ({ stackName, action }) => {
                const g = guard(ctx, 'docker', 'manage');
                if (g) return g;
                try {
                    await kyDocker.post(`composes/${stackName}/${action}`).json();
                    return ok(`Stack "${stackName}" — ${action} completed`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
