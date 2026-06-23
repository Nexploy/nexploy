import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    composeActionMcpSchema,
    composeStackNameMcpSchema,
    deployComposeSchema,
    validateComposeSyntaxMcpSchema,
} from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
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
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get('composes', { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json<any[]>();
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
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get(`composes/${stackName}/status`, {
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any>();
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
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get(`composes/${stackName}/list`, {
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any[]>();
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
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('composes/validate-syntax', {
                            json: { content: yaml },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
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
            async ({ stackName, yaml }) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('composes/deploy', {
                            json: { stackName, yaml },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any>();
                    return ok(
                        `Stack "${stackName}" deployed. Logs: ${(result.logs ?? []).slice(-3).join(' | ')}`,
                    );
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
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post(`composes/${stackName}/${action}`, {
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Stack "${stackName}" — ${action} completed`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
