import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ContainersEvent } from '@workspace/typescript-interface/docker/docker.containers';
import { getContainersStateManager } from '@/managers/list/containersStateManager';
import {
    filterNexployContainers,
    isNexployInfrastructureContainer,
} from '@workspace/shared/nexployFilter';
import { createInitialStateGate } from '@/utils/initialStateGate';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getContainersStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        const handleInitialState = async (containerEvent: ContainersEvent) => {
            try {
                const filteredEvent = {
                    ...containerEvent,
                    containers: containerEvent.containers
                        ? filterNexployContainers(containerEvent.containers)
                        : undefined,
                };
                await stream.writeSSE({
                    data: JSON.stringify(filteredEvent),
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
                const filteredEvent = {
                    ...containerEvent,
                    containers: containerEvent.containers
                        ? filterNexployContainers(containerEvent.containers)
                        : undefined,
                };
                await stream.writeSSE({
                    data: JSON.stringify(filteredEvent),
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
                if (
                    containerEvent.container &&
                    isNexployInfrastructureContainer(containerEvent.container)
                ) {
                    return;
                }
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
                if (
                    containerEvent.container &&
                    isNexployInfrastructureContainer(containerEvent.container)
                ) {
                    return;
                }
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
                if (
                    containerEvent.container &&
                    isNexployInfrastructureContainer(containerEvent.container)
                ) {
                    return;
                }
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
                cleanup();
            }
        }, 15000);

        const gate = createInitialStateGate();
        const onInitialState = gate.gate(handleInitialState);
        const onStateChange = gate.gate(handleStateChange);
        const onContainerAdded = gate.gate(handleContainerAdded);
        const onContainerUpdated = gate.gate(handleContainerUpdated);
        const onContainerRemoved = gate.gate(handleContainerRemoved);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('initial-state', onInitialState);
            manager.off('state-change', onStateChange);
            manager.off('container-added', onContainerAdded);
            manager.off('container-updated', onContainerUpdated);
            manager.off('container-removed', onContainerRemoved);
        };

        manager.on('initial-state', onInitialState);
        manager.on('state-change', onStateChange);
        manager.on('container-added', onContainerAdded);
        manager.on('container-updated', onContainerUpdated);
        manager.on('container-removed', onContainerRemoved);

        const allContainers = manager.getAllStates();
        const containers = filterNexployContainers(allContainers);
        await handleInitialState({ type: 'initial', containers, timestamp: Date.now() });
        await gate.release();

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
