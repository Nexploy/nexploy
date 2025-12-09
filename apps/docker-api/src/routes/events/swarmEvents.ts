import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import type { SwarmEvent } from '@workspace/typescript-interface/docker/swarm';
import { swarmStateManager } from '@/managers/swarmStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Swarm client connected');

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

        // Heartbeat
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
                clearInterval(heartbeat);
            }
        }, 15000);

        // Cleanup function
        const cleanup = () => {
            clearInterval(heartbeat);

            swarmStateManager.off('initial-state', handleInitialState);
            swarmStateManager.off('node-added', handleNodeAdded);
            swarmStateManager.off('node-updated', handleNodeUpdated);
            swarmStateManager.off('node-removed', handleNodeRemoved);
            swarmStateManager.off('service-added', handleServiceAdded);
            swarmStateManager.off('service-updated', handleServiceUpdated);
            swarmStateManager.off('service-removed', handleServiceRemoved);
            swarmStateManager.off('task-added', handleTaskAdded);
            swarmStateManager.off('task-updated', handleTaskUpdated);
            swarmStateManager.off('task-removed', handleTaskRemoved);
            swarmStateManager.off('swarm-updated', handleSwarmUpdated);

            logger.info({ clientId }, 'SSE Swarm client disconnected');
        };

        // Send initial state
        const isSwarmActive = swarmStateManager.getIsSwarmActive();

        if (isSwarmActive) {
            await sendEvent(
                {
                    type: 'initial',
                    isSwarmActive: true,
                    swarmInfo: swarmStateManager.getSwarmInfo()!,
                    nodes: swarmStateManager.getAllNodes(),
                    services: swarmStateManager.getAllServices(),
                    tasks: swarmStateManager.getAllTasks(),
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

        // Register event listeners
        swarmStateManager.on('initial-state', handleInitialState);
        swarmStateManager.on('node-added', handleNodeAdded);
        swarmStateManager.on('node-updated', handleNodeUpdated);
        swarmStateManager.on('node-removed', handleNodeRemoved);
        swarmStateManager.on('service-added', handleServiceAdded);
        swarmStateManager.on('service-updated', handleServiceUpdated);
        swarmStateManager.on('service-removed', handleServiceRemoved);
        swarmStateManager.on('task-added', handleTaskAdded);
        swarmStateManager.on('task-updated', handleTaskUpdated);
        swarmStateManager.on('task-removed', handleTaskRemoved);
        swarmStateManager.on('swarm-updated', handleSwarmUpdated);

        // Handle client disconnect
        c.req.raw.signal.addEventListener('abort', cleanup);

        // Keep connection alive
        await stream.sleep(2_147_483_647);
    });
});

export default app;
