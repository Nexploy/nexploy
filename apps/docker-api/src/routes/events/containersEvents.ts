import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainersEvent } from '@workspace/typescript-interface/docker/docker.containers';
import { containersStateManager } from '@/managers/containersStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Containers client connected');

        const handleInitialState = async (containerEvent: ContainersEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(containerEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleStateChange = async (containerEvent: ContainersEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(containerEvent),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleContainerAdded = async (containerEvent: ContainersEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(containerEvent),
                    event: 'container-added',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-added');
                cleanup();
            }
        };

        const handleContainerUpdated = async (containerEvent: ContainersEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(containerEvent),
                    event: 'container-updated',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-updated');
                cleanup();
            }
        };

        const handleContainerRemoved = async (containerEvent: ContainersEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(containerEvent),
                    event: 'container-removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-removed');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: ContainersEvent = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err }, 'Error sending heartbeat');
                clearInterval(heartbeat);
            }
        }, 15000);

        const cleanup = () => {
            containersStateManager.off('initial-state', handleInitialState);
            containersStateManager.off('state-change', handleStateChange);
            containersStateManager.off('container-added', handleContainerAdded);
            containersStateManager.off('container-updated', handleContainerUpdated);
            containersStateManager.off('container-removed', handleContainerRemoved);

            logger.info({ clientId }, 'SSE Containers client disconnected');
        };

        const containers = containersStateManager.getAllStates();
        await handleInitialState({ type: 'initial', containers, timestamp: Date.now() });

        containersStateManager.on('initial-state', handleInitialState);
        containersStateManager.on('state-change', handleStateChange);
        containersStateManager.on('container-added', handleContainerAdded);
        containersStateManager.on('container-updated', handleContainerUpdated);
        containersStateManager.on('container-removed', handleContainerRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
