import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { containerStateManager } from '@/managers/containerStateManager';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { ContainerCreateForm } from '@workspace/schemas-zod/container/containerCreate.schema';
import { ContainerCreateOptions } from 'dockerode';
import { logger } from '@/utils/logger';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await containerStateManager.hardRefresh();
    }),
);

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
        const info = await container.inspect();
        return {
            id: container.id,
            name: body.name,
            status: 'created',
            message: 'Container created successfully',
            info,
        };
    }),
);

/**
 * @openapi
 * /containers/{id}/start:
 *   post:
 *     summary: Start container
 *     description: Starts a stopped container or unpauses a paused container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container started or unpaused
 *       400:
 *         description: Container already running
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/start',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        return await container.start();
    }),
);

/**
 * @openapi
 * /containers/{id}/stop:
 *   post:
 *     summary: Stop container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *         description: Seconds to wait before killing
 *     responses:
 *       200:
 *         description: Container stopped
 *       304:
 *         description: Container already stopped
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/stop',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        return await container.stop();
    }),
);

/**
 * @openapi
 * /containers/{id}/pause:
 *   post:
 *     summary: Pause container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container paused
 *       400:
 *         description: Container not running or already paused
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/pause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.pause();
    }),
);

/**
 * @openapi
 * /containers/{id}/unpause:
 *   post:
 *     summary: Unpause container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container unpaused
 *       400:
 *         description: Container not paused
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/unpause',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.unpause();
    }),
);

/**
 * @openapi
 * /containers/{id}/restart:
 *   post:
 *     summary: Restart container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *         description: Seconds to wait before killing
 *     responses:
 *       200:
 *         description: Container restarted
 *       404:
 *         description: Container not found
 */
app.post(
    '/:id/restart',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.restart();
    }),
);

/**
 * @openapi
 * /containers/{id}/info:
 *   get:
 *     summary: Get container information
 *     description: Returns detailed information about a specific container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID or name
 *     responses:
 *       200:
 *         description: Container information
 *       404:
 *         description: Container not found
 */
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

/**
 * @openapi
 * /containers/{id}:
 *   delete:
 *     summary: Remove container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Force remove even if running
 *       - in: query
 *         name: v
 *         schema:
 *           type: boolean
 *         description: Remove associated volumes
 *     responses:
 *       200:
 *         description: Container removed
 *       400:
 *         description: Container is running (use force=true)
 *       404:
 *         description: Container not found
 */
app.delete(
    '/:id/remove',
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const container = docker.getContainer(id);

        await container.remove();
    }),
);

/**
 * @openapi
 * /containers/{id}/logs:
 *   get:
 *     summary: Get container logs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tail
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to show from end
 *       - in: query
 *         name: follow
 *         schema:
 *           type: boolean
 *         description: Follow log output
 *     responses:
 *       200:
 *         description: Logs of the container
 *       404:
 *         description: Container not found
 */
app.get(
    '/:id/logs',
    handleAsync(async (c) => {
        const id = c.req.param('id');

        const container = docker.getContainer(id);
        const tail = c.req.query('tail') ? parseInt(c.req.query('tail')!) : 100;

        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail,
        });

        return {
            logs: logs.toString('utf-8'),
            tail,
        };
    }),
);

/**
 * @openapi
 * /containers/events/container/{id}:
 *   get:
 *     summary: Get current state of specific container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container state
 *       404:
 *         description: Container not found
 */
app.get('/container/:id', (c) => {
    const id = c.req.param('id');
    const container = containerStateManager.getContainer(id);

    if (!container) {
        return c.json({ error: 'Container not found' }, 404);
    }

    return c.json({
        container,
        dockerStatus: dockerStatusManager.getStatus(),
        timestamp: Date.now(),
    });
});

/**
 * @openapi
 * /containers/events/status:
 *   get:
 *     summary: Get Docker daemon status
 *     responses:
 *       200:
 *         description: Docker status information
 */
app.get('/status', (c) => {
    const stats = containerStateManager.getStats();
    return c.json({
        ...stats,
        timestamp: Date.now(),
    });
});

/**
 * @openapi
 * /containers/events/current:
 *   get:
 *     summary: Get current state of all containers
 *     responses:
 *       200:
 *         description: Current container states
 */
app.get('/current', (c) => {
    const containers = containerStateManager.getAllStates();
    return c.json(containers);
});

export default app;
