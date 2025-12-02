import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { swarmStateManager } from '@/managers/swarmStateManager';
import { logger } from '@/utils/logger';
import { SwarmEvent } from '@workspace/typescript-interface/docker/docker.swarm';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Swarm client connected');

        const handleInitialState = async (swarmEvent: SwarmEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(swarmEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state');
                cleanup();
            }
        };

        const handleNodeAdded = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'node-added',
                id: `${Date.now()}`,
            });
        };

        const handleNodeUpdated = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'node-updated',
                id: `${Date.now()}`,
            });
        };

        const handleNodeRemoved = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'node-removed',
                id: `${Date.now()}`,
            });
        };

        const handleServiceAdded = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'service-added',
                id: `${Date.now()}`,
            });
        };

        const handleServiceUpdated = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'service-updated',
                id: `${Date.now()}`,
            });
        };

        const handleServiceRemoved = async (swarmEvent: SwarmEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(swarmEvent),
                event: 'service-removed',
                id: `${Date.now()}`,
            });
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: SwarmEvent = {
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
            clearInterval(heartbeat);

            swarmStateManager.off('initial-state', handleInitialState);
            swarmStateManager.off('node-added', handleNodeAdded);
            swarmStateManager.off('node-updated', handleNodeUpdated);
            swarmStateManager.off('node-removed', handleNodeRemoved);
            swarmStateManager.off('service-added', handleServiceAdded);
            swarmStateManager.off('service-updated', handleServiceUpdated);
            swarmStateManager.off('service-removed', handleServiceRemoved);

            logger.info({ clientId }, 'SSE Swarm client disconnected');
        };

        const isSwarmActive = swarmStateManager.getIsSwarmActive();

        if (isSwarmActive) {
            await handleInitialState({
                type: 'initial',
                swarmInfo: swarmStateManager.getSwarmInfo() || undefined,
                nodes: swarmStateManager.getAllNodes(),
                services: swarmStateManager.getAllServices(),
                timestamp: Date.now(),
            });
        } else {
            await handleInitialState({
                type: 'not-in-swarm',
                timestamp: Date.now(),
            });
        }

        swarmStateManager.on('initial-state', handleInitialState);
        swarmStateManager.on('node-added', handleNodeAdded);
        swarmStateManager.on('node-updated', handleNodeUpdated);
        swarmStateManager.on('node-removed', handleNodeRemoved);
        swarmStateManager.on('service-added', handleServiceAdded);
        swarmStateManager.on('service-updated', handleServiceUpdated);
        swarmStateManager.on('service-removed', handleServiceRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
