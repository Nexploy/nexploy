import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { ContainerCreateForm } from '@workspace/schemas-zod/container/containerCreate.schema';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';
import {
    ContainerRecreateFormSchema,
    Port,
} from '@workspace/schemas-zod/container/containerRecreate.schema';

const app = new Hono();

app.post(
    '/create',
    handleAsync(async (c) => {
        const body: ContainerCreateForm = await c.req.json();

        try {
            await docker.getImage(body.image).inspect();
        } catch (error) {
            logger.info(`Image ${body.image} not found locally, pulling...`);
            await new Promise((resolve, reject) => {
                docker.pull(body.image, (err: any, stream: NodeJS.ReadableStream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(stream, (error: any, output: any) => {
                        if (error) return reject(error);
                        resolve(output);
                    });
                });
            });
        }

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

        const parsed = ContainerRecreateFormSchema.parse(body);

        const container = docker.getContainer(parsed.containerId);
        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        const exposedPorts: { [key: string]: {} } = { ...containerInfo.Config.ExposedPorts };
        const portBindings: { [key: string]: { HostPort: string }[] } = {
            ...containerInfo.HostConfig.PortBindings,
        };

        const changePort = (port: Port) => {
            const currKey = `${port.currentPrivatePort}/${port.currentType}`;
            delete exposedPorts[currKey];
            if (portBindings[currKey]) {
                portBindings[currKey] = portBindings[currKey].filter(
                    (b) => b.HostPort !== String(port.currentPublicPort),
                );
                if (portBindings[currKey].length === 0) {
                    delete portBindings[currKey];
                }
            }
        };

        parsed.ports.forEach((port) => {
            if (port.typeAction === 'add') {
                const key = `${port.privatePort}/${port.type}`;
                exposedPorts[key] = {};
                if (!portBindings[key]) portBindings[key] = [];
                portBindings[key].push({ HostPort: String(port.publicPort) });
            } else if (port.typeAction === 'edit') {
                changePort(port);

                const newKey = `${port.privatePort}/${port.type}`;
                exposedPorts[newKey] = {};
                if (!portBindings[newKey]) portBindings[newKey] = [];
                portBindings[newKey].push({ HostPort: String(port.publicPort) });
            } else if (port.typeAction === 'delete') {
                changePort(port);
            }
        });

        await container.remove();

        const createOptions: ContainerCreateOptions = {
            name: containerInfo.Name.replace('/', ''),
            Image: containerInfo.Config.Image,
            Hostname: containerInfo.Config.Hostname,
            Env: containerInfo.Config.Env,
            Cmd: containerInfo.Config.Cmd,
            Entrypoint: containerInfo.Config.Entrypoint,
            Volumes: containerInfo.Config.Volumes,
            WorkingDir: containerInfo.Config.WorkingDir,
            User: containerInfo.Config.User,
            Labels: containerInfo.Config.Labels,
            ExposedPorts: exposedPorts,
            HostConfig: {
                ...containerInfo.HostConfig,
                PortBindings: portBindings,
            },
        };

        const newContainer = await docker.createContainer(createOptions);

        try {
            await newContainer.start();
        } finally {
            return { id: newContainer.id };
        }
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
                const err = new Error(`Container '${id}' not found`);
                (err as any).status = 404;
                throw err;
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
            throw new Error('Container not found');
        }

        return {
            container,
            dockerStatus: dockerStatusManager.getStatus(),
            timestamp: Date.now(),
        };
    }),
);

app.get('/status', (c) => {
    const stats = containersStateManager.getStats();
    return c.json({
        ...stats,
        timestamp: Date.now(),
    });
});

app.get('/current', (c) => {
    const containers = containersStateManager.getAllStates();
    return c.json(containers);
});

export default app;
