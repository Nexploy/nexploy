import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import {
    mcpContainerActionSchema,
    mcpExecInContainerSchema,
    mcpGetContainerLogsSchema,
    mcpListContainersSchema,
} from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { mcpTriggerBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { getRepositories } from '@/services/repository.service';
import { startBuildRepository } from '@/services/repository/build.service';
import { Container } from '@workspace/typescript-interface/docker/docker.container';

function ok(text: string) {
    return { content: [{ type: 'text' as const, text }] };
}

function fail(error: string) {
    return { content: [{ type: 'text' as const, text: `Error: ${error}` }], isError: true };
}

export function createNexployMCPServer(userId: string): McpServer {
    const server = new McpServer({ name: 'nexploy-mcp', version: '1.0.0' });

    server.registerTool(
        'listContainers',
        {
            description: 'List Docker containers. Use filter to narrow by status.',
            inputSchema: mcpListContainersSchema.shape,
        },
        async ({ filter }) => {
            try {
                const containers = await kyDocker.get('containers').json<Container[]>();
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
        'containerAction',
        {
            description: 'Start, stop, restart, or remove a container by name or partial ID.',
            inputSchema: mcpContainerActionSchema.shape,
        },
        async ({ idOrName, action }) => {
            try {
                const containers = await kyDocker.get('containers').json<Container[]>();
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
                    });
                } else {
                    await kyDocker.post(`container/${action}`, {
                        json: { containerIds: [match.id] },
                    });
                }
                return ok(`Container "${name}" ${action}ed successfully`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'createContainer',
        {
            description: 'Create and start a new Docker container',
            inputSchema: containerCreateFormSchema.shape,
        },
        async (params) => {
            try {
                const response = await kyDocker
                    .post('container/create', { json: params })
                    .json<{ id: string }>();
                return ok(`Container created (ID: ${response.id?.slice(0, 12)})`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'getContainerLogs',
        {
            description: 'Get recent logs from a container',
            inputSchema: mcpGetContainerLogsSchema.shape,
        },
        async ({ idOrName, tail }) => {
            try {
                const { logs } = await kyDocker
                    .get(`container/${idOrName}/logs`, {
                        searchParams: { tail: String(tail ?? 50) },
                    })
                    .json<{ logs: string }>();
                return ok(logs);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'execInContainer',
        {
            description: 'Execute a shell command inside a running container',
            inputSchema: mcpExecInContainerSchema.shape,
        },
        async ({ idOrName, command }) => {
            try {
                const result = await kyDocker
                    .post(`container/${idOrName}/exec`, { json: { command } })
                    .json<{ exitCode: number; output: string }>();
                return ok(`Exit code: ${result.exitCode}\n\n${result.output}`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'listImages',
        { description: 'List all locally available Docker images' },
        async () => {
            try {
                const images = await kyDocker.get('images').json<any[]>();
                const data = images.map((img) => ({
                    id: img.id?.replace('sha256:', '').slice(0, 12) ?? img.id,
                    tags: img.repoTags ?? img.tags ?? [],
                    size: img.size ? `${Math.round(img.size / 1024 / 1024)}MB` : 'unknown',
                }));
                return ok(JSON.stringify({ count: images.length, data }));
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'pullImage',
        {
            description: 'Pull a Docker image from a registry',
            inputSchema: imagePullSchema.shape,
        },
        async (params) => {
            try {
                await kyDocker.post('images/pull', { json: params }).json();
                return ok(`Started pulling \`${params.imageName}\`. This may take a moment.`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool('listVolumes', { description: 'List all Docker volumes' }, async () => {
        try {
            const volumes = await kyDocker.get('volumes').json<any[]>();
            const data = volumes.map((v) => ({ name: v.name, driver: v.driver }));
            return ok(JSON.stringify({ count: volumes.length, data }));
        } catch (e: any) {
            return fail(e.message);
        }
    });

    server.registerTool(
        'createVolume',
        {
            description: 'Create a Docker volume',
            inputSchema: volumeCreateSchema.shape,
        },
        async (params) => {
            try {
                await kyDocker.post('volumes/create', { json: params }).json();
                return ok(`Volume \`${params.name}\` created`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'createNetwork',
        {
            description: 'Create a Docker network',
            inputSchema: networkCreateSchema.shape,
        },
        async (params) => {
            try {
                await kyDocker.post('networks/create', { json: params }).json();
                return ok(`Network \`${params.name}\` created`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'listRepositories',
        { description: 'List all Nexploy repositories with their latest build/deployment status' },
        async () => {
            try {
                const repos = await getRepositories();
                const data = repos.map((repo) => ({
                    id: repo.id,
                    name: repo.name,
                    url: repo.repositoryUrl,
                    lastBuild: repo.build?.[0]
                        ? {
                              id: repo.build[0].id,
                              status: repo.build[0].status,
                              createdAt: repo.build[0].createdAt,
                          }
                        : null,
                }));
                return ok(JSON.stringify({ count: repos.length, data }));
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    server.registerTool(
        'triggerRepositoryBuild',
        {
            description: 'Start a new build and deployment for a Nexploy repository',
            inputSchema: mcpTriggerBuildSchema.shape,
        },
        async ({ repositoryId, branch }) => {
            try {
                const build = await startBuildRepository({ repositoryId, branch }, userId);
                return ok(`Build started (ID: ${build.id})`);
            } catch (e: any) {
                return fail(e.message);
            }
        },
    );

    return server;
}
