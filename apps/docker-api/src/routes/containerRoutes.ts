import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { ContainerCreateForm } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import { getTranslations } from '@/middleware/locale.middleware';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { PortType } from '@workspace/typescript-interface/docker/docker.port';
import { HttpError } from '@workspace/shared/http-error';

const NAMED_VOLUME_REGEX = /\/var\/lib\/docker\/volumes\/([^/]+)\/_data/;

const app = new Hono();

app.post(
    '/create',
    handleAsync(async (c) => {
        const body: ContainerCreateForm = await c.req.json();

        const createOptions: ContainerCreateOptions = {
            name: body.name,
            Image: body.image,
            Hostname: body.hostname,
            HostConfig: {
                RestartPolicy: {
                    Name: body.restart,
                    MaximumRetryCount: body.restart === 'on-failure' ? 3 : 0,
                },
                AutoRemove: body.autoRemove,
                Privileged: body.privileged,
            },
        };

        if (!createOptions.HostConfig) {
            createOptions.HostConfig = {};
        }

        if (body.network) {
            createOptions.HostConfig.NetworkMode = body.network;
        }
        if (body.ports.length > 0) {
            createOptions.ExposedPorts = {};
            createOptions.HostConfig.PortBindings = {};
            const exposedPorts = createOptions.ExposedPorts;
            const portBindings = createOptions.HostConfig.PortBindings;

            body.ports.forEach((port) => {
                const containerPortKey = `${port.containerPort}/${port.protocol}`;
                exposedPorts[containerPortKey] = {};
                portBindings[containerPortKey] = [
                    {
                        HostPort: port.hostPort,
                    },
                ];
            });
        }
        if (body.envVars.length > 0) {
            createOptions.Env = body.envVars.map((env) => `${env.key}=${env.value}`);
        }
        if (body.volumes.length > 0) {
            createOptions.HostConfig.Binds = body.volumes.map((vol) => {
                const mode = vol.readOnly ? 'ro' : 'rw';
                return `${vol.hostPath}:${vol.containerPath}:${mode}`;
            });
        }
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
    handleAsync(async (c) => {
        const body = await c.req.json();
        const { ports, envVars, volumes, networks, containerId } =
            ContainerRecreateFormSchema.parse(body);

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
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        return await container.start();
    }),
);

app.post(
    '/:id/stop',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        return await container.stop();
    }),
);

app.post(
    '/:id/pause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.pause();
    }),
);

app.post(
    '/:id/unpause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.unpause();
    }),
);

app.post(
    '/:id/restart',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.restart();
    }),
);

app.get(
    '/:id/info',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        try {
            return await container.inspect();
        } catch (error: any) {
            if (error.statusCode === 404) {
                const t = getTranslations(c, 'docker');
                throw new HttpError(t('errors.containerNotFound', { id }), 404);
            }

            throw error;
        }
    }),
);

app.delete(
    '/:id/remove',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        return await container.remove();
    }),
);

app.get(
    '/:id',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = containersStateManager.getContainer(id);

        if (!container) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.containerNotFound', { id }), 404);
        }

        return {
            container,
            dockerStatus: dockerStatusManager.getStatus(),
            timestamp: Date.now(),
        };
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

export default app;
