import { docker } from '@/utils/dockerClient';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import { ensureImage } from '@/utils/ensureImage';
import { PassThrough } from 'stream';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';
import { HttpError } from '@workspace/shared/http-error';
import { zValidator } from '@hono/zod-validator';
import { containerParamSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';
import { containersStateManager } from '@/managers/containersStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';

const NAMED_VOLUME_REGEX = /\/var\/lib\/docker\/volumes\/([^/]+)\/_data/;

const app = new Hono();

app.post(
    '/run-ephemeral',
    handleAsync(async (c) => {
        const { image, command, workdir, mountPath, networkMode } = await c.req.json<{
            image: string;
            command: string;
            workdir?: string;
            mountPath?: string;
            networkMode?: string;
        }>();

        const dockerClient = getCurrentDockerClient();
        await ensureImage(dockerClient, image);

        const binds: string[] = [];
        if (mountPath) {
            const containerWorkdir = workdir ?? '/workspace';
            binds.push(`${mountPath}:${containerWorkdir}`);
        }

        const container = await dockerClient.createContainer({
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
    '/:name/logs',
    handleAsync(async (c) => {
        const name = c.req.param('name');
        const tail = c.req.query('tail') ?? '100';
        const since = c.req.query('since');

        const dockerClient = getCurrentDockerClient();
        const container = dockerClient.getContainer(decodeURIComponent(name!));

        const logsOptions: Record<string, unknown> = {
            stdout: true,
            stderr: true,
            follow: false,
            tail: parseInt(tail, 10),
        };
        if (since) logsOptions['since'] = since;

        const logBuffer = await container.logs(logsOptions);

        const logs = parseDockerLogs(logBuffer);
        return { logs };
    }),
);

app.post(
    '/:name/exec',
    handleAsync(async (c) => {
        const name = c.req.param('name');
        const { command, workdir } = await c.req.json<{
            command: string;
            workdir?: string;
        }>();

        const dockerClient = getCurrentDockerClient();
        const container = dockerClient.getContainer(decodeURIComponent(name!));

        const execOptions: Record<string, unknown> = {
            Cmd: ['sh', '-c', command],
            AttachStdout: true,
            AttachStderr: true,
        };
        if (workdir) execOptions['WorkingDir'] = workdir;

        const exec = await container.exec(execOptions as any);
        const stream = await exec.start({ hijack: true, stdin: false });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        const stdoutPassthrough = new PassThrough();
        const stderrPassthrough = new PassThrough();
        stdoutPassthrough.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
        stderrPassthrough.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

        await new Promise<void>((resolve, reject) => {
            dockerClient.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        const output = [
            Buffer.concat(stdoutChunks).toString('utf8'),
            Buffer.concat(stderrChunks).toString('utf8'),
        ]
            .join('')
            .trim();

        const { ExitCode: exitCode } = await exec.inspect();
        return { exitCode: exitCode ?? 0, output };
    }),
);

app.post(
    '/create',
    zValidator('json', containerCreateFormSchema),
    handleAsync(async (c) => {
        const {
            envVars,
            volumes,
            network,
            hostname,
            name,
            ports,
            restart,
            image,
            privileged,
            autoRemove,
        } = getValidatedJson(c, containerCreateFormSchema);

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
                Privileged: privileged,
            },
        };

        if (!createOptions.HostConfig) {
            createOptions.HostConfig = {};
        }

        if (network) {
            createOptions.HostConfig.NetworkMode = network;
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
                        HostPort: port.hostPort,
                    },
                ];
            });
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
        await ensureImage(docker, image);
        const container = await docker.createContainer(createOptions);

        try {
            await container.start();
        } catch (error: any) {
            logger.warn(`Container ${container.id} created but failed to start: ${error.message}`);
        }

        return {
            id: container.id,
        };
    }),
);

app.post(
    '/recreate',
    zValidator('json', ContainerRecreateFormSchema),
    handleAsync(async (c) => {
        const { ports, envVars, volumes, networks, containerId } = getValidatedJson(
            c,
            ContainerRecreateFormSchema,
        );

        const container = docker.getContainer(containerId);
        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        const exposedPorts = { ...containerInfo.Config.ExposedPorts };
        const portBindings = { ...containerInfo.HostConfig.PortBindings };

        const removePort = (privatePort: number, type: PortType, publicPort: number) => {
            const key = `${privatePort}/${type}`;
            delete exposedPorts[key];
            if (portBindings[key]) {
                portBindings[key] = portBindings[key].filter(
                    (b: any) => b.HostPort !== String(publicPort),
                );
                if (portBindings[key].length === 0) delete portBindings[key];
            }
        };

        const addPort = (privatePort: number, type: PortType, publicPort: number) => {
            const key = `${privatePort}/${type}`;
            exposedPorts[key] = {};
            portBindings[key] = portBindings[key] || [];
            portBindings[key].push({ HostPort: String(publicPort) });
        };

        for (const port of ports) {
            if (port.typeAction === 'delete' || port.typeAction === 'edit') {
                if (port.currentPrivatePort && port.currentType) {
                    if (port.currentPublicPort) {
                        removePort(
                            port.currentPrivatePort,
                            port.currentType,
                            port.currentPublicPort,
                        );
                    } else {
                        const key = `${port.currentPrivatePort}/${port.currentType}`;
                        delete exposedPorts[key];
                        delete portBindings[key];
                    }
                }
            }
            if (port.typeAction === 'add' || port.typeAction === 'edit') {
                if (port.privatePort && port.type && port.publicPort) {
                    addPort(port.privatePort, port.type, port.publicPort);
                } else if (port.typeAction === 'edit' && port.privatePort && port.type) {
                    exposedPorts[`${port.privatePort}/${port.type}`] = {};
                }
            }
        }

        const envMap = new Map(
            (containerInfo.Config.Env || []).map((e) => {
                const [key, ...valueParts] = e.split('=');
                return [key, valueParts.join('=')];
            }),
        );

        for (const envVar of envVars) {
            if (envVar.typeAction === 'delete' && envVar.currentKey) {
                envMap.delete(envVar.currentKey);
            } else if (envVar.typeAction === 'edit') {
                if (envVar.currentKey) envMap.delete(envVar.currentKey);
                if (envVar.key && envVar.value !== undefined) {
                    envMap.set(envVar.key, envVar.value);
                }
            } else if (envVar.typeAction === 'add' && envVar.key && envVar.value !== undefined) {
                envMap.set(envVar.key, envVar.value);
            }
        }

        const env = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`);

        const bindsSet = new Set(containerInfo.HostConfig.Binds || []);
        const volumesConfig = { ...(containerInfo.Config.Volumes || {}) };

        const getBindString = (hostPath: string, containerPath: string, readOnly: boolean) =>
            `${hostPath}:${containerPath}${readOnly ? ':ro' : ''}`;

        for (const volume of volumes) {
            if (volume.typeAction === 'delete') {
                if (volume.currentHostPath && volume.currentContainerPath) {
                    let hostPath = volume.currentHostPath;
                    const namedVolumeMatch = hostPath.match(NAMED_VOLUME_REGEX);
                    if (namedVolumeMatch) {
                        hostPath = namedVolumeMatch[1];
                    }

                    const bindWithSuffix = getBindString(
                        hostPath,
                        volume.currentContainerPath,
                        volume.currentReadOnly || false,
                    );
                    const bindWithoutSuffix = `${hostPath}:${volume.currentContainerPath}`;
                    const bindWithRW = `${hostPath}:${volume.currentContainerPath}:rw`;
                    const bindWithRO = `${hostPath}:${volume.currentContainerPath}:ro`;

                    bindsSet.delete(bindWithSuffix) ||
                        bindsSet.delete(bindWithoutSuffix) ||
                        bindsSet.delete(bindWithRW) ||
                        bindsSet.delete(bindWithRO);

                    delete volumesConfig[volume.currentContainerPath];
                }
            }
            if (volume.typeAction === 'add') {
                if (volume.hostPath && volume.containerPath) {
                    let hostPath = volume.hostPath;
                    const namedVolumeMatch = hostPath.match(NAMED_VOLUME_REGEX);
                    if (namedVolumeMatch) {
                        hostPath = namedVolumeMatch[1];
                    }

                    bindsSet.add(
                        getBindString(hostPath, volume.containerPath, volume.readOnly || false),
                    );
                    volumesConfig[volume.containerPath] = {};
                }
            }
        }

        const networksSet = new Set(Object.keys(containerInfo.NetworkSettings.Networks || {}));

        for (const network of networks) {
            if (network.typeAction === 'delete') {
                if (network.currentName) networksSet.delete(network.currentName);
            }
            if (network.typeAction === 'add') {
                if (network.name) networksSet.add(network.name);
            }
        }

        const networksConfig = Object.fromEntries(
            Array.from(networksSet).map((name) => [name, {}]),
        );

        await container.remove();

        const newContainer = await docker.createContainer({
            name: containerInfo.Name.replace('/', ''),
            Image: containerInfo.Config.Image,
            Hostname: containerInfo.Config.Hostname,
            Env: env,
            Cmd: containerInfo.Config.Cmd,
            Entrypoint: containerInfo.Config.Entrypoint,
            Volumes: volumesConfig,
            WorkingDir: containerInfo.Config.WorkingDir,
            User: containerInfo.Config.User,
            Labels: containerInfo.Config.Labels,
            ExposedPorts: exposedPorts,
            HostConfig: {
                ...containerInfo.HostConfig,
                PortBindings: portBindings,
                Binds: Array.from(bindsSet),
            },
            NetworkingConfig: {
                EndpointsConfig: networksConfig,
            },
        });

        await newContainer.start();
        return { id: newContainer.id };
    }),
);

app.post(
    '/:id/start',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        return await container.start();
    }),
);

app.post(
    '/:id/stop',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        return await container.stop();
    }),
);

app.post(
    '/:id/pause',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        await container.pause();
    }),
);

app.post(
    '/:id/unpause',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        await container.unpause();
    }),
);

app.post(
    '/:id/restart',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        await container.restart();
    }),
);

app.get(
    '/:id/info',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        try {
            return await container.inspect();
        } catch (error: any) {
            if (error.statusCode === 404) {
                throw new HttpError(`Container '${id}' not found`, 404);
            }

            throw error;
        }
    }),
);

app.delete(
    '/:id/remove',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = docker.getContainer(id);

        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        return await container.remove();
    }),
);

app.get(
    '/status',
    handleAsync(async () => {
        const stats = containersStateManager.getStats();
        return {
            ...stats,
            timestamp: Date.now(),
        };
    }),
);

app.get(
    '/current',
    handleAsync(async () => {
        return containersStateManager.getAllStates();
    }),
);

app.get(
    '/:id',
    zValidator('param', containerParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, containerParamSchema);
        const container = containersStateManager.getContainer(id);

        if (!container) {
            throw new HttpError(`Container '${id}' not found`, 404);
        }

        return {
            container,
            dockerStatus: dockerStatusManager.getStatus(),
            timestamp: Date.now(),
        };
    }),
);

export default app;
