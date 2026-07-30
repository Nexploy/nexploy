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
import { ContainersStatsManager } from '@/managers/list/containersStatsManager';
import { ContainersStatsEvent } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { SingleResourceManagerRegistry } from '@/lib/SingleResourceManagerRegistry';

const containersStatsRegistry = new SingleResourceManagerRegistry(
    'ContainersStats',
    (refreshRate, environmentId) =>
        new ContainersStatsManager(environmentId, parseInt(refreshRate, 10)),
);

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

app.get('/stream/stats/:refreshRate', (c) => {
    const refreshRate = c.req.param('refreshRate');
    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        let manager: ContainersStatsManager;
        try {
            manager = await containersStatsRegistry.acquire(refreshRate, environmentId);
        } catch (err) {
            logger.error({ err, clientId }, 'Failed to start containers stats monitor');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start containers stats monitoring' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const send = (event: string) => async (statsEvent: ContainersStatsEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(statsEvent),
                    event,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, `Error sending containers stats ${event}`);
                cleanup();
            }
        };

        const handleInitialState = send('initial-state');
        const handleStatsUpdate = send('stats-update');
        const handleError = send('error');

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending containers stats heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 30000);

        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;

            clearInterval(heartbeat);
            manager.off('initial-state', handleInitialState);
            manager.off('stats-update', handleStatsUpdate);
            manager.off('stream-error', handleError);
            containersStatsRegistry.release(refreshRate, environmentId);
        };

        manager.on('initial-state', handleInitialState);
        manager.on('stats-update', handleStatsUpdate);
        manager.on('stream-error', handleError);

        const currentEvent = manager.getCurrentEvent();
        if (currentEvent) {
            await handleInitialState(currentEvent);
        }

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
