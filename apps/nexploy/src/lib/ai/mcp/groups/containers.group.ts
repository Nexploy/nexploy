import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import {
    containerRenameSchema,
    mcpContainerActionSchema,
    mcpExecInContainerSchema,
    mcpGetContainerLogsSchema,
    mcpListContainersSchema,
} from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { Container } from '@workspace/typescript-interface/docker/docker.container';
import { fail, guard, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

async function resolveContainer(
    idOrName: string,
    environmentId?: string,
): Promise<{ match: Container; name: string } | null> {
    const containers = await kyDocker
        .get('containers', { environmentId } as KyDockerOptions)
        .json<Container[]>();
    const match = containers.find(
        (c) => c.id?.startsWith(idOrName) || c.name === idOrName || c.name === `/${idOrName}`,
    );
    if (!match) return null;
    return { match, name: match.name.replace(/^\//, '') };
}

export const containersGroup: ToolGroup = {
    name: 'containers',

    register(server: McpServer, ctx: ToolContext) {
        server.registerTool(
            'listContainers',
            {
                description: 'List Docker containers. Use filter to narrow by status.',
                inputSchema: mcpListContainersSchema.shape,
            },
            async ({ filter }) => {
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const containers = await kyDocker
                        .get('containers', { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json<Container[]>();
                    const filtered =
                        filter === 'running'
                            ? containers.filter((c) => c.state === 'running')
                            : filter === 'stopped'
                              ? containers.filter((c) => c.state !== 'running')
                              : containers;
                    const data = filtered.map((c) => ({
                        id: c.id?.slice(0, 12),
                        name: c.name?.replace(/^\//, ''),
                        state: c.state,
                        image: c.image,
                        status: c.status,
                    }));
                    return ok(JSON.stringify({ count: filtered.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'inspectContainer',
            {
                description:
                    'Get full inspection details of a container (config, mounts, network, state).',
                inputSchema: z.object({
                    idOrName: z.string().describe('Container name or partial ID'),
                }).shape,
            },
            async ({ idOrName }) => {
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get(`container/${idOrName}/inspect`, {
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
            'getContainerLogs',
            {
                description: 'Get recent logs from a container.',
                inputSchema: mcpGetContainerLogsSchema.shape,
            },
            async ({ idOrName, tail }) => {
                const g = guard(ctx, 'container', 'read');
                if (g) return g;
                try {
                    const { logs } = await kyDocker
                        .get(`container/${idOrName}/logs`, {
                            searchParams: { tail: String(tail ?? 50) },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<{ logs: string }>();
                    return ok(logs);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'containerAction',
            {
                description: 'Start, stop, restart, or remove a container by name or partial ID.',
                inputSchema: mcpContainerActionSchema.shape,
            },
            async ({ idOrName, action }) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const containers = await kyDocker
                        .get('containers', { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json<Container[]>();
                    const match = containers.find(
                        (c) =>
                            c.id?.startsWith(idOrName) ||
                            c.name === idOrName ||
                            c.name === `/${idOrName}`,
                    );
                    if (!match) {
                        const names = containers.map((c) => c.name.replace(/^\//, '')).join(', ');
                        return fail(`No container matching "${idOrName}". Available: ${names}`);
                    }
                    const name = match.name.replace(/^\//, '');
                    if (action === 'remove') {
                        await kyDocker.delete('container/remove', {
                            json: { containerIds: [match.id] },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions);
                    } else {
                        await kyDocker.post(`container/${action}`, {
                            json: { containerIds: [match.id] },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions);
                    }
                    return ok(`Container "${name}" ${action}ed successfully`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'pauseContainer',
            {
                description: 'Pause a running container by name or partial ID.',
                inputSchema: z.object({
                    idOrName: z.string().describe('Container name or partial ID'),
                }).shape,
            },
            async ({ idOrName }) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const resolved = await resolveContainer(idOrName, ctx.environmentId);
                    if (!resolved) return fail(`No container matching "${idOrName}"`);
                    await kyDocker.post('container/pause', {
                        json: { containerIds: [resolved.match.id] },
                        environmentId: ctx.environmentId,
                    } as KyDockerOptions);
                    return ok(`Container "${resolved.name}" paused`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'unpauseContainer',
            {
                description: 'Unpause a paused container by name or partial ID.',
                inputSchema: z.object({
                    idOrName: z.string().describe('Container name or partial ID'),
                }).shape,
            },
            async ({ idOrName }) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const resolved = await resolveContainer(idOrName, ctx.environmentId);
                    if (!resolved) return fail(`No container matching "${idOrName}"`);
                    await kyDocker.post('container/unpause', {
                        json: { containerIds: [resolved.match.id] },
                        environmentId: ctx.environmentId,
                    } as KyDockerOptions);
                    return ok(`Container "${resolved.name}" unpaused`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'renameContainer',
            {
                description: 'Rename a container.',
                inputSchema: containerRenameSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post('container/rename', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Container renamed to "${params.name}"`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'recreateContainer',
            {
                description:
                    'Recreate a container with an updated configuration (ports, env vars, volumes, networks).',
                inputSchema: ContainerRecreateFormSchema.shape,
            },
            async (params: import('zod').infer<typeof ContainerRecreateFormSchema>) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post('container/recreate', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Container recreated successfully`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'createContainer',
            {
                description: 'Create and start a new Docker container.',
                inputSchema: containerCreateFormSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const response = await kyDocker
                        .post('container/create', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<{ id: string }>();
                    return ok(`Container created (ID: ${response.id?.slice(0, 12)})`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        if (ctx.allowExecInContainer !== false) server.registerTool(
            'execInContainer',
            {
                description: 'Execute a shell command inside a running container.',
                inputSchema: mcpExecInContainerSchema.shape,
            },
            async ({ idOrName, command }) => {
                const g = guard(ctx, 'container', 'manage');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post(`container/${idOrName}/exec`, {
                            json: { command },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<{ exitCode: number; output: string }>();
                    return ok(`Exit code: ${result.exitCode}\n\n${result.output}`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
