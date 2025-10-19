import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { containerStateManager } from '@/services/containerStateManager';
import { logger } from '@/utils/logger';
import { ContainerEvent } from '@workspace/typescript-interface/docker';

const app = new Hono();

app.get('/stream', (c) => {
    const watchContainers = c.req.query('containers')?.split(',').filter(Boolean);

    return streamSSE(c, async (stream) => {
        let isActive = true;
        const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        logger.info({ clientId, watchContainers }, 'SSE client connected');

        const initialState = containerStateManager.getAllStates();
        const filteredInitial = watchContainers
            ? initialState.filter((s) => watchContainers.includes(s.id))
            : initialState;

        const initialStateData: ContainerEvent = {
            type: 'initial',
            containers: filteredInitial,
            dockerStatus: containerStateManager.getDockerStatus(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStateData),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        const heartbeatInterval = setInterval(async () => {
            if (!isActive) return;
            try {
                const heartbeatData: ContainerEvent = {
                    type: 'heartbeat',
                    dockerStatus: containerStateManager.getDockerStatus(),
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending heartbeat');
                cleanup();
            }
        }, 15000);

        const handleStateChange = async (event: any) => {
            if (!isActive) return;

            if (watchContainers && !watchContainers.includes(event.container.id)) {
                return;
            }

            try {
                const stateChangeData: ContainerEvent = {
                    type: event.type,
                    container: event.container,
                    changes: event.changes,
                    dockerStatus: containerStateManager.getDockerStatus(),
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(stateChangeData),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending state change');
                cleanup();
            }
        };

        const handleContainerAdded = async (container: any) => {
            if (!isActive) return;
            if (watchContainers && !watchContainers.includes(container.id)) return;

            try {
                const containerAddedData: ContainerEvent = {
                    type: 'added',
                    container,
                    dockerStatus: containerStateManager.getDockerStatus(),
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(containerAddedData),
                    event: 'container-added',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-added');
                cleanup();
            }
        };

        const handleContainerRemoved = async (event: any) => {
            if (!isActive) return;
            if (watchContainers && !watchContainers.includes(event.id)) return;

            try {
                const containerRemovedData: ContainerEvent = {
                    type: 'removed',
                    containerId: event.id,
                    oldState: event.oldState,
                    dockerStatus: containerStateManager.getDockerStatus(),
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(containerRemovedData),
                    event: 'container-removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-removed');
                cleanup();
            }
        };

        const handleDockerConnecting = async (event: any) => {
            if (!isActive) return;

            try {
                const dockerStatusData: ContainerEvent = {
                    type: 'docker-connecting',
                    dockerStatus: 'connecting',
                    message: 'Connecting to Docker daemon...',
                    timestamp: event.timestamp,
                };

                await stream.writeSSE({
                    data: JSON.stringify(dockerStatusData),
                    event: 'docker-status',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending docker-connecting');
                cleanup();
            }
        };

        const handleDockerAvailable = async (event: any) => {
            if (!isActive) return;

            try {
                const currentState = containerStateManager.getAllStates();
                const filtered = watchContainers
                    ? currentState.filter((s) => watchContainers.includes(s.id))
                    : currentState;

                const dockerStatusData: ContainerEvent = {
                    type: 'docker-available',
                    dockerStatus: 'connected',
                    containers: filtered,
                    message: 'Docker daemon is now available',
                    timestamp: event.timestamp,
                };

                await stream.writeSSE({
                    data: JSON.stringify(dockerStatusData),
                    event: 'docker-status',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending docker-available');
                cleanup();
            }
        };

        const handleDockerUnavailable = async (event: any) => {
            if (!isActive) return;

            try {
                const dockerStatus = containerStateManager.getDockerStatus();

                const dockerStatusData: ContainerEvent = {
                    type: 'docker-unavailable',
                    dockerStatus: dockerStatus,
                    containers: [],
                    message: event.message || 'Docker daemon is unavailable',
                    timestamp: event.timestamp,
                };

                await stream.writeSSE({
                    data: JSON.stringify(dockerStatusData),
                    event: 'docker-status',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending docker-unavailable');
                cleanup();
            }
        };

        const cleanup = () => {
            if (!isActive) return;
            isActive = false;

            clearInterval(heartbeatInterval);
            containerStateManager.off('state-change', handleStateChange);
            containerStateManager.off('container-added', handleContainerAdded);
            containerStateManager.off('container-removed', handleContainerRemoved);
            containerStateManager.off('docker-connecting', handleDockerConnecting);
            containerStateManager.off('docker-available', handleDockerAvailable);
            containerStateManager.off('docker-unavailable', handleDockerUnavailable);

            logger.info({ clientId }, 'SSE client disconnected');
        };

        containerStateManager.on('state-change', handleStateChange);
        containerStateManager.on('container-added', handleContainerAdded);
        containerStateManager.on('container-removed', handleContainerRemoved);
        containerStateManager.on('docker-connecting', handleDockerConnecting);
        containerStateManager.on('docker-available', handleDockerAvailable);
        containerStateManager.on('docker-unavailable', handleDockerUnavailable);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
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
    const states = containerStateManager.getAllStates();
    return c.json({
        containers: states,
        dockerStatus: containerStateManager.getDockerStatus(),
        count: states.length,
        timestamp: Date.now(),
    });
});

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
    const state = containerStateManager.getState(id);

    if (!state) {
        return c.json({ error: 'Container not found' }, 404);
    }

    return c.json({
        container: state,
        dockerStatus: containerStateManager.getDockerStatus(),
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

export default app;
