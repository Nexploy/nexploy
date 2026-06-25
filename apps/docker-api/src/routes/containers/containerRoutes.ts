import { docker } from '@/utils/dockerClient';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { ensureImage } from '@/utils/ensureImage';
import { PassThrough } from 'stream';
import { route } from '@/utils/route';
import { Hono } from 'hono';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';
import { HttpError } from '@workspace/shared/http-error';
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
import { containersStateManager } from '@/managers/list/containersStateManager';
import { pullImage as pullImageService } from '@/services/imageService';

const NAMED_VOLUME_REGEX = /\/var\/lib\/docker\/volumes\/([^/]+)\/_data/;

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
            labels,
            hostname,
            name,
            ports,
            restart,
            image,
            privileged,
            autoRemove,
            auth,
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
            createOptions.NetworkingConfig = {
                EndpointsConfig: Object.fromEntries(networks.map((net) => [net.name, {}])),
            };
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
        const { ports, envVars, volumes, networks, containerId, image, pullImage, auth } =
            c.req.valid('json');

        const container = docker.getContainer(containerId);
        const containerInfo = await container.inspect();

        const targetImage = image?.trim() || containerInfo.Config.Image;
        const imageChanged = targetImage !== containerInfo.Config.Image;

        if (pullImage || imageChanged) {
            await pullImageService(targetImage, auth);
        }

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
            Image: targetImage,
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
