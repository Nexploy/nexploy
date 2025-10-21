import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { Container, ContainerEvent } from '@workspace/typescript-interface/docker.container';
import { containerStateManager } from '@/services/containerStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    const watchContainers = c.req.query('containers')?.split(',').filter(Boolean);

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId, watchContainers }, 'SSE Container client connected');

        const handleInitialState = async (containers: Container[]) => {
            const filteredInitial = watchContainers
                ? containers.filter((s) => watchContainers.includes(s.id))
                : containers;

            try {
                const initialStateData: ContainerEvent = {
                    type: 'initial',
                    containers: filteredInitial,
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(initialStateData),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleStateChange = async (containerEvent: ContainerEvent) => {
            // if (watchContainers && !watchContainers.includes(event.container?.id)) return;

            try {
                const stateChangeData: ContainerEvent = {
                    ...containerEvent,
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(stateChangeData),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleContainerAdded = async (containerEvent: ContainerEvent) => {
            // if (watchContainers && !watchContainers.includes(container.id)) return;

            try {
                const containerAddedData: ContainerEvent = {
                    ...containerEvent,
                    type: 'added',
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

        const handleContainerUpdated = async (containerEvent: ContainerEvent) => {
            // if (watchContainers && !watchContainers.includes(container?.id)) return;

            try {
                const containerUpdatedData: ContainerEvent = {
                    ...containerEvent,
                    type: 'updated',
                    timestamp: Date.now(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(containerUpdatedData),
                    event: 'container-updated',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending container-updated');
                cleanup();
            }
        };

        const handleContainerRemoved = async (containerEvent: ContainerEvent) => {
            // if (watchContainers && !watchContainers.includes(event.id)) return;

            try {
                const containerRemovedData: ContainerEvent = {
                    ...containerEvent,
                    type: 'removed',
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

        const cleanup = () => {
            containerStateManager.off('state-change', handleStateChange);
            containerStateManager.off('initial-state', handleInitialState);
            containerStateManager.off('container-added', handleContainerAdded);
            containerStateManager.off('container-updated', handleContainerUpdated);
            containerStateManager.off('container-removed', handleContainerRemoved);

            logger.info({ clientId }, 'SSE Container client disconnected');
        };

        const containers = containerStateManager.getAllStates();
        await handleInitialState(containers);

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
