import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainerEvent } from '@workspace/typescript-interface/docker.container';
import { containerStateManager } from '@/services/containerStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Container client connected');

        const handleInitialState = async (containerEvent: ContainerEvent) => {
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

        const handleStateChange = async (containerEvent: ContainerEvent) => {
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

        const handleContainerAdded = async (containerEvent: ContainerEvent) => {
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

        const handleContainerUpdated = async (containerEvent: ContainerEvent) => {
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

        const handleContainerRemoved = async (containerEvent: ContainerEvent) => {
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
                const heartbeatData: ContainerEvent = {
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
            containerStateManager.off('state-change', handleStateChange);
            containerStateManager.off('initial-state', handleInitialState);
            containerStateManager.off('container-added', handleContainerAdded);
            containerStateManager.off('container-updated', handleContainerUpdated);
            containerStateManager.off('container-removed', handleContainerRemoved);

            logger.info({ clientId }, 'SSE Container client disconnected');
        };

        const containers = containerStateManager.getAllStates();
        await handleInitialState({ type: 'initial', containers, timestamp: Date.now() });

        containerStateManager.on('state-change', handleStateChange);
        containerStateManager.on('initial-state', handleInitialState);
        containerStateManager.on('container-added', handleContainerAdded);
        containerStateManager.on('container-updated', handleContainerUpdated);
        containerStateManager.on('container-removed', handleContainerRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
