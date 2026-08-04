import { docker } from '@/utils/dockerClient';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { ensureImage } from '@/utils/ensureImage';
import { PassThrough } from 'stream';
import { route } from '@/utils/route';
import { Hono } from 'hono';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import { HttpError } from '@nexploy/shared/http-error';
import {
    containerActionsSchema,
    containerExecBodySchema,
    containerIdOrNameParamSchema,
    containerLogsQuerySchema,
    containerRemoveSchema,
    containerRenameBodySchema,
    containerRunEphemeralSchema,
} from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { containerMigrateApiSchema } from '@workspace/schemas-zod/docker/container/containerMigrate.schema';
import { startContainerMigration } from '@/services/containerMigrationService';
import { recreateContainer, startContainerRecreate } from '@/services/containerRecreateService';
import { containersStateManager } from '@/managers/list/containersStateManager';
import { networksStateManager } from '@/managers/list/networksStateManager';
import { TRAEFIK_NETWORK_NAME } from '@/lib/config';
import { assertSafeBindPath } from '@/utils/hostBindGuard';

const DEFAULT_PIDS_LIMIT = 512;

const app = new Hono();

app.get(
    '/:idOrName',
    route({ param: containerIdOrNameParamSchema }, async (c) => {
        const { idOrName } = c.req.valid('param');

        const container = docker.getContainer(idOrName);
        const containerInfo = await container.inspect();

        if (!container) {
            throw new HttpError(`Container '${idOrName}' not found`, 404);
        }

        return containerInfo;
    }),
);

app.post(
    '/run-ephemeral',
    route({ json: containerRunEphemeralSchema }, async (c) => {
        const { image, command, workdir, mountPath, networkMode } = c.req.valid('json');

        await ensureImage(docker, image);

        const binds: string[] = [];
        if (mountPath) {
            const containerWorkdir = workdir ?? '/workspace';
            binds.push(`${mountPath}:${containerWorkdir}`);
        }

        const container = await docker.createContainer({
            Image: image,
            Cmd: ['sh', '-c', command],
            WorkingDir: workdir ?? '/workspace',
            AttachStdout: true,
            AttachStderr: true,
            HostConfig: {
                AutoRemove: false,
                Binds: binds.length > 0 ? binds : undefined,
                NetworkMode: networkMode,
            },
        });

        let exitCode = 0;
        let output = '';

        try {
            await container.start();
            const waitResult = await container.wait();
            exitCode = waitResult.StatusCode;

            const logBuffer = (await container.logs({
                stdout: true,
                stderr: true,
                follow: false,
            })) as Buffer;

            output = parseDockerLogs(logBuffer);
        } finally {
            container.remove({ force: true }).catch(() => {});
        }

        return { exitCode, output };
    }),
);

app.get(
    '/:idOrName/logs',
    route({ param: containerIdOrNameParamSchema, query: containerLogsQuerySchema }, async (c) => {
        const { idOrName } = c.req.valid('param');
        const { tail = '100', since } = c.req.valid('query');

        const container = docker.getContainer(idOrName);

        const logsOptions: Record<string, unknown> = {
            stdout: true,
            stderr: true,
            follow: false,
            tail: parseInt(tail, 10),
        };
        if (since) logsOptions['since'] = Number(since);

        const logBuffer = await container.logs(logsOptions);

        const logs = parseDockerLogs(logBuffer);
        return { logs };
    }),
);

app.post(
    '/:idOrName/exec',
    route({ param: containerIdOrNameParamSchema, json: containerExecBodySchema }, async (c) => {
        const { idOrName } = c.req.valid('param');
        const { command, workdir, user } = c.req.valid('json');

        const container = docker.getContainer(idOrName);

        const execOptions: Record<string, unknown> = {
            Cmd: ['sh', '-c', command],
            AttachStdout: true,
            AttachStderr: true,
        };
        if (workdir) execOptions['WorkingDir'] = workdir;
        if (user) execOptions['User'] = user;

        const exec = await container.exec(execOptions as any);
        const stream = await exec.start({ hijack: true, stdin: false });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        const stdoutPassthrough = new PassThrough();
        const stderrPassthrough = new PassThrough();
        stdoutPassthrough.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
        stderrPassthrough.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

        await new Promise<void>((resolve, reject) => {
            docker.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        const output = [Buffer.concat(stdoutChunks).toString('utf8'), Buffer.concat(stderrChunks).toString('utf8')]
            .join('')
            .trim();

        const { ExitCode: exitCode } = await exec.inspect();
        return { exitCode: exitCode ?? 0, output };
    }),
);

app.post(
    '/create',
    route({ json: containerCreateFormSchema }, async (c) => {
        const { envVars, volumes, networks, labels, hostname, name, ports, restart, image, autoRemove, auth } =
            c.req.valid('json');

        volumes.forEach((vol) => assertSafeBindPath(vol.hostPath));

        const createOptions: ContainerCreateOptions = {
            name,
            Image: image,
            Hostname: hostname,
            HostConfig: {
                RestartPolicy: {
                    Name: restart,
                    MaximumRetryCount: restart === 'on-failure' ? 3 : 0,
                },
                AutoRemove: autoRemove,
                Privileged: false,
                PidsLimit: DEFAULT_PIDS_LIMIT,
            },
        };

        if (!createOptions.HostConfig) {
            createOptions.HostConfig = {};
        }

        const endpointsConfig: Record<string, {}> = Object.fromEntries(networks.map((net) => [net.name, {}]));

        if (!(TRAEFIK_NETWORK_NAME in endpointsConfig)) {
            try {
                await networksStateManager.createNetworkIfMissing(TRAEFIK_NETWORK_NAME);
                endpointsConfig[TRAEFIK_NETWORK_NAME] = {};
            } catch (error) {
                logger.warn(
                    { error, network: TRAEFIK_NETWORK_NAME },
                    'Could not attach container to Traefik network, continuing without it',
                );
            }
        }

        if (Object.keys(endpointsConfig).length > 0) {
            createOptions.NetworkingConfig = { EndpointsConfig: endpointsConfig };
        }

        if (ports.length > 0) {
            createOptions.ExposedPorts = {};
            createOptions.HostConfig.PortBindings = {};
            const exposedPorts = createOptions.ExposedPorts;
            const portBindings = createOptions.HostConfig.PortBindings;

            ports.forEach((port) => {
                const containerPortKey = `${port.containerPort}/${port.protocol}`;
                exposedPorts[containerPortKey] = {};
                portBindings[containerPortKey] = [
                    {
                        HostPort: String(port.hostPort),
                    },
                ];
            });
        }
        if (labels.length > 0) {
            createOptions.Labels = Object.fromEntries(labels.map((l) => [l.key, l.value]));
        }
        if (envVars.length > 0) {
            createOptions.Env = envVars.map((env) => `${env.key}=${env.value}`);
        }
        if (volumes.length > 0) {
            createOptions.HostConfig.Binds = volumes.map((vol) => {
                const mode = vol.readOnly ? 'ro' : 'rw';
                return `${vol.hostPath}:${vol.containerPath}:${mode}`;
            });
        }
        await ensureImage(docker, image, auth);
        const container = await docker.createContainer(createOptions);

        try {
            await container.start();
        } catch (error: any) {
            logger.warn(`Container ${container.id} created but failed to start: ${error.message}`);
        }

        return { id: container.id };
    }),
);

app.post(
    '/recreate',
    route({ json: ContainerRecreateFormSchema }, async (c) => {
        const payload = c.req.valid('json');

        const containerInfo = await docker.getContainer(payload.containerId).inspect();
        const containerName = containerInfo.Name.replace(/^\//, '');

        if (payload.async) {
            return startContainerRecreate(payload, containerName);
        }

        return recreateContainer(docker, payload);
    }),
);

app.post(
    '/migrate',
    route({ json: containerMigrateApiSchema }, async (c) => {
        return startContainerMigration(c.req.valid('json'));
    }),
);

app.post(
    '/rename',
    route({ json: containerRenameBodySchema }, async (c) => {
        const { containerId, name } = c.req.valid('json');
        const container = docker.getContainer(containerId);
        await container.rename({ name });
        return { name };
    }),
);

app.post(
    '/start',
    route({ json: containerActionsSchema }, async (c) => {
        const { containerIds } = c.req.valid('json');
        await Promise.all(containerIds.map((id) => docker.getContainer(id).start()));
    }),
);

app.post(
    '/stop',
    route({ json: containerActionsSchema }, async (c) => {
        const { containerIds } = c.req.valid('json');
        await Promise.all(containerIds.map((id) => docker.getContainer(id).stop()));
    }),
);

app.post(
    '/pause',
    route({ json: containerActionsSchema }, async (c) => {
        const { containerIds } = c.req.valid('json');
        await Promise.all(containerIds.map((id) => docker.getContainer(id).pause()));
    }),
);

app.post(
    '/unpause',
    route({ json: containerActionsSchema }, async (c) => {
        const { containerIds } = c.req.valid('json');
        await Promise.all(containerIds.map((id) => docker.getContainer(id).unpause()));
    }),
);

app.post(
    '/restart',
    route({ json: containerActionsSchema }, async (c) => {
        const { containerIds } = c.req.valid('json');
        await Promise.all(containerIds.map((id) => docker.getContainer(id).restart()));
    }),
);

app.delete(
    '/remove',
    route({ json: containerRemoveSchema }, async (c) => {
        const { containerIds, removeVolumes, force } = c.req.valid('json');
        await Promise.all(
            containerIds.map(async (id) => {
                const container = docker.getContainer(id);
                const containerInfo = await container.inspect();
                if (containerInfo.State.Running && !force) await container.stop();
                return container.remove({ force, v: removeVolumes });
            }),
        );
    }),
);

app.get(
    '/status',
    route(async () => {
        const stats = containersStateManager.getStats();
        return {
            ...stats,
            timestamp: Date.now(),
        };
    }),
);

app.get(
    '/current',
    route(async () => {
        return containersStateManager.getAllStates();
    }),
);

export default app;
