import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { NetworkStateManager } from '@/managers/networkStateManager';
import { NetworkDetailEvent } from '@workspace/typescript-interface/docker/docker.network';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';

const app = new Hono();

app.get('/stream/:networkId', (c) => {
    const networkId = c.req.param('networkId');

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;
    const manager = new NetworkStateManager(networkId, environmentId);

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        try {
            await manager.start();
        } catch (err) {
            logger.error({ err, clientId, networkId }, 'Failed to start network monitor');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start monitoring' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleInitialState = async (event: NetworkDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, networkId }, 'Error sending initial-state');
                cleanup();
            }
        };

        const handleStateChange = async (event: NetworkDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, networkId }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleRemoved = async (event: NetworkDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, networkId }, 'Error sending removed');
                cleanup();
            }
        };

        const handleNotFound = async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'not-found', networkId, timestamp: Date.now() }),
                    event: 'not-found',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, networkId }, 'Error sending not-found');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', networkId, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, networkId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('initial-state', handleInitialState);
            manager.off('state-change', handleStateChange);
            manager.off('removed', handleRemoved);
            manager.off('not-found', handleNotFound);
            manager.stop();
        };

        manager.on('initial-state', handleInitialState);
        manager.on('state-change', handleStateChange);
        manager.on('removed', handleRemoved);
        manager.on('not-found', handleNotFound);

        const currentState = manager.getCurrentState();
        if (currentState) {
            await handleInitialState({
                type: 'initial-state',
                networkId,
                network: currentState,
                timestamp: Date.now(),
            });
        } else {
            await handleNotFound();
        }

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
