import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { ContainerCreateForm } from '@workspace/schemas-zod/container/containerCreate.schema';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';

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

app.put(
    '/:id/port',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();

        const { containerPort, hostPort, protocol = 'tcp' } = body;

        if (!containerPort || !hostPort) {
            const err = new Error('containerPort and hostPort are required');
            (err as any).status = 400;
            throw err;
        }

        const container = docker.getContainer(id);

        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        const currentExposedPorts = containerInfo.Config.ExposedPorts || {};
        const currentPortBindings = containerInfo.HostConfig.PortBindings || {};

        const containerPortKey = `${containerPort}/${protocol}`;
        currentExposedPorts[containerPortKey] = {};
        currentPortBindings[containerPortKey] = [
            ...(currentPortBindings[containerPortKey] || []),
            {
                HostPort: hostPort.toString(),
            },
        ];

        await container.remove();

        const createOptions: ContainerCreateOptions = {
            name: containerInfo.Name.replace('/', ''),
            Image: containerInfo.Config.Image,
            Hostname: containerInfo.Config.Hostname,
            Env: containerInfo.Config.Env,
            ExposedPorts: currentExposedPorts,
            HostConfig: {
                ...containerInfo.HostConfig,
                PortBindings: currentPortBindings,
            },
        };

        const newContainer = await docker.createContainer(createOptions);
        await newContainer.start();

        return {
            id: newContainer.id,
        };
    }),
);

app.patch(
    '/:id/port',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();

        const {
            containerPort,
            hostPort,
            protocol,
            currentContainerPort,
            currentHostPort,
            currentProtocol,
        } = body;

        const container = docker.getContainer(id);
        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        const currentExposedPorts = containerInfo.Config.ExposedPorts || {};
        const currentPortBindings = containerInfo.HostConfig.PortBindings || {};

        const currentPortKey = `${currentContainerPort}/${currentProtocol}`;

        if (!currentPortBindings[currentPortKey]) {
            const err = new Error(`Port ${currentPortKey} not found`);
            (err as any).status = 404;
            throw err;
        }

        const existingHostPort = parseInt(currentPortBindings[currentPortKey][0].HostPort, 10);
        if (existingHostPort !== currentHostPort) {
            const err = new Error(
                `Port mismatch: expected host port ${currentHostPort}, found ${existingHostPort}`,
            );
            (err as any).status = 400;
            throw err;
        }

        const finalContainerPort = containerPort ?? currentContainerPort;
        const finalHostPort = hostPort ?? currentHostPort;
        const finalProtocol = protocol ?? currentProtocol;

        const newPortKey = `${finalContainerPort}/${finalProtocol}`;
        if (currentPortKey !== newPortKey) {
            delete currentExposedPorts[currentPortKey];
            delete currentPortBindings[currentPortKey];
        }

        currentExposedPorts[newPortKey] = {};
        currentPortBindings[newPortKey] = [
            {
                HostPort: finalHostPort.toString(),
            },
        ];

        await container.remove();

        const createOptions: ContainerCreateOptions = {
            name: containerInfo.Name.replace('/', ''),
            Image: containerInfo.Config.Image,
            Hostname: containerInfo.Config.Hostname,
            Env: containerInfo.Config.Env,
            Cmd: containerInfo.Config.Cmd,
            Entrypoint: containerInfo.Config.Entrypoint,
            WorkingDir: containerInfo.Config.WorkingDir,
            User: containerInfo.Config.User,
            Labels: containerInfo.Config.Labels,
            ExposedPorts: currentExposedPorts,
            HostConfig: {
                ...containerInfo.HostConfig,
                PortBindings: currentPortBindings,
            },
        };

        const newContainer = await docker.createContainer(createOptions);
        await newContainer.start();

        return {
            id: newContainer.id,
        };
    }),
);

app.delete(
    '/:id/port/:containerPort/:protocol/:hostPort',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const containerPort = c.req.param('containerPort');
        const protocol = c.req.param('protocol');
        const hostPort = c.req.param('hostPort');

        const container = docker.getContainer(id);
        const containerInfo = await container.inspect();

        if (containerInfo.State.Running) await container.stop();

        const currentExposedPorts = containerInfo.Config.ExposedPorts || {};
        const currentPortBindings = containerInfo.HostConfig.PortBindings || {};

        const portKey = `${containerPort}/${protocol}`;

        if (!currentPortBindings[portKey]) {
            const err = new Error(`Port ${portKey} not found`);
            (err as any).status = 404;
            throw err;
        }

        const existingHostPort = currentPortBindings[portKey][0]?.HostPort;
        if (existingHostPort !== hostPort) {
            const err = new Error(
                `Port mismatch: expected host port ${hostPort}, found ${existingHostPort}`,
            );
            (err as any).status = 400;
            throw err;
        }

        delete currentExposedPorts[portKey];
        delete currentPortBindings[portKey];

        await container.remove();

        const createOptions: ContainerCreateOptions = {
            name: containerInfo.Name.replace('/', ''),
            Image: containerInfo.Config.Image,
            Hostname: containerInfo.Config.Hostname,
            Env: containerInfo.Config.Env,
            Cmd: containerInfo.Config.Cmd,
            Entrypoint: containerInfo.Config.Entrypoint,
            WorkingDir: containerInfo.Config.WorkingDir,
            User: containerInfo.Config.User,
            Labels: containerInfo.Config.Labels,
            ExposedPorts: currentExposedPorts,
            HostConfig: {
                ...containerInfo.HostConfig,
                PortBindings: currentPortBindings,
            },
        };

        const newContainer = await docker.createContainer(createOptions);
        await newContainer.start();

        return {
            id: newContainer.id,
            message: `Port ${portKey}:${hostPort} deleted successfully`,
            deletedPort: {
                containerPort: parseInt(containerPort, 10),
                hostPort: parseInt(hostPort, 10),
                protocol,
            },
        };
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
