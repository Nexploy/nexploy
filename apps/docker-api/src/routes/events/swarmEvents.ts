import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import type { SwarmEvent } from '@workspace/typescript-interface/docker/swarm';
import { getSwarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getSwarmStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const sendEvent = async (event: SwarmEvent, eventName: string) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: eventName,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, eventName }, 'Error sending SSE event');
            }
        };

        const handleInitialState = (event: SwarmEvent) => sendEvent(event, 'initial-state');
        const handleNodeAdded = (event: SwarmEvent) => sendEvent(event, 'node-added');
        const handleNodeUpdated = (event: SwarmEvent) => sendEvent(event, 'node-updated');
        const handleNodeRemoved = (event: SwarmEvent) => sendEvent(event, 'node-removed');
        const handleServiceAdded = (event: SwarmEvent) => sendEvent(event, 'service-added');
        const handleServiceUpdated = (event: SwarmEvent) => sendEvent(event, 'service-updated');
        const handleServiceRemoved = (event: SwarmEvent) => sendEvent(event, 'service-removed');
        const handleTaskAdded = (event: SwarmEvent) => sendEvent(event, 'task-added');
        const handleTaskUpdated = (event: SwarmEvent) => sendEvent(event, 'task-updated');
        const handleTaskRemoved = (event: SwarmEvent) => sendEvent(event, 'task-removed');
        const handleSwarmUpdated = (event: SwarmEvent) => sendEvent(event, 'swarm-updated');

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatEvent: SwarmEvent = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                };
                await stream.writeSSE({
                    data: JSON.stringify(heartbeatEvent),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err }, 'Error sending heartbeat');
                cleanup();
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            manager.off('initial-state', handleInitialState);
            manager.off('node-added', handleNodeAdded);
            manager.off('node-updated', handleNodeUpdated);
            manager.off('node-removed', handleNodeRemoved);
            manager.off('service-added', handleServiceAdded);
            manager.off('service-updated', handleServiceUpdated);
            manager.off('service-removed', handleServiceRemoved);
            manager.off('task-added', handleTaskAdded);
            manager.off('task-updated', handleTaskUpdated);
            manager.off('task-removed', handleTaskRemoved);
            manager.off('swarm-updated', handleSwarmUpdated);
        };

        const isSwarmActive = manager.getIsSwarmActive();

        if (isSwarmActive) {
            await sendEvent(
                {
                    type: 'initial',
                    isSwarmActive: true,
                    swarmInfo: manager.getSwarmInfo()!,
                    nodes: manager.getAllNodes(),
                    services: manager.getAllServices(),
                    tasks: manager.getAllTasks(),
                    timestamp: Date.now(),
                },
                'initial-state',
            );
        } else {
            await sendEvent(
                {
                    type: 'not-in-swarm',
                    isSwarmActive: false,
                    timestamp: Date.now(),
                },
                'initial-state',
            );
        }

        manager.on('initial-state', handleInitialState);
        manager.on('node-added', handleNodeAdded);
        manager.on('node-updated', handleNodeUpdated);
        manager.on('node-removed', handleNodeRemoved);
        manager.on('service-added', handleServiceAdded);
        manager.on('service-updated', handleServiceUpdated);
        manager.on('service-removed', handleServiceRemoved);
        manager.on('task-added', handleTaskAdded);
        manager.on('task-updated', handleTaskUpdated);
        manager.on('task-removed', handleTaskRemoved);
        manager.on('swarm-updated', handleSwarmUpdated);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
