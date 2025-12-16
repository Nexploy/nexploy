import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainersEvent } from '@workspace/typescript-interface/docker/docker.containers';
import { getContainersStateManager } from '@/managers/containersStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    // Capture the manager BEFORE entering streamSSE to preserve AsyncLocalStorage context
    const manager = getContainersStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
            manager.off('initial-state', handleInitialState);
            manager.off('state-change', handleStateChange);
            manager.off('container-added', handleContainerAdded);
            manager.off('container-updated', handleContainerUpdated);
            manager.off('container-removed', handleContainerRemoved);
        };

        const containers = manager.getAllStates();
        await handleInitialState({ type: 'initial', containers, timestamp: Date.now() });

        manager.on('initial-state', handleInitialState);
        manager.on('state-change', handleStateChange);
        manager.on('container-added', handleContainerAdded);
        manager.on('container-updated', handleContainerUpdated);
        manager.on('container-removed', handleContainerRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
