import { docker } from '@/utils/dockerClient';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { ensureImage } from '@/utils/ensureImage';
import { PassThrough } from 'stream';
import { route } from '@/helpers/route';
import { Hono } from 'hono';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';
import { HttpError } from '@workspace/shared/http-error';
import {
    containerExecBodySchema,
    containerIdParamSchema,
    containerLogsQuerySchema,
    containerRenameBodySchema,
    containerRunEphemeralSchema,
} from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { containersStateManager } from '@/managers/containersStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';

const NAMED_VOLUME_REGEX = /\/var\/lib\/docker\/volumes\/([^/]+)\/_data/;

const app = new Hono();

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
    '/:id/logs',
    route({ param: containerIdParamSchema, query: containerLogsQuerySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { tail = '100', since } = c.req.valid('query');

        const container = docker.getContainer(id);

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
    '/:id/exec',
    route({ param: containerIdParamSchema, json: containerExecBodySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { command, workdir, user } = c.req.valid('json');

        const container = docker.getContainer(id);

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
    route({ json: containerCreateFormSchema }, async (c) => {
        const {
            envVars,
            volumes,
            networks,
            hostname,
            name,
            ports,
            restart,
            image,
            privileged,
            autoRemove,
        } = c.req.valid('json');

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

        if (networks.length > 0) {
            createOptions.HostConfig.NetworkMode = networks[0];
            if (networks.length > 1) {
                createOptions.NetworkingConfig = {
                    EndpointsConfig: Object.fromEntries(
                        networks.map((net) => [net, {}]),
                    ),
                };
            }
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

        return { id: container.id };
    }),
);

app.post(
    '/recreate',
    route({ json: ContainerRecreateFormSchema }, async (c) => {
        const { ports, envVars, volumes, networks, containerId } = c.req.valid('json');

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
    '/:id/rename',
    route({ param: containerIdParamSchema, json: containerRenameBodySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { name } = c.req.valid('json');
        const container = docker.getContainer(id);
        await container.rename({ name });
        return { name };
    }),
);

app.post(
    '/:id/start',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        return await docker.getContainer(id).start();
    }),
);

app.post(
    '/:id/stop',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        return await docker.getContainer(id).stop();
    }),
);

app.post(
    '/:id/pause',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        await docker.getContainer(id).pause();
    }),
);

app.post(
    '/:id/unpause',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        await docker.getContainer(id).unpause();
    }),
);

app.post(
    '/:id/restart',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        await docker.getContainer(id).restart();
    }),
);

app.get(
    '/:id/info',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
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
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        const container = docker.getContainer(id);

        const containerInfo = await container.inspect();
        if (containerInfo.State.Running) await container.stop();

        return await container.remove();
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

app.get(
    '/:id',
    route({ param: containerIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
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
