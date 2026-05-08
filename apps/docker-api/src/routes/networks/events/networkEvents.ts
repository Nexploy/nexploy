import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { NetworkStateManager } from '@/managers/detail/networkStateManager';
import { NetworkDetailEvent } from '@workspace/typescript-interface/docker/docker.network';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { SingleResourceManagerRegistry } from '@/lib/SingleResourceManagerRegistry';

const networkManagerRegistry = new SingleResourceManagerRegistry(
    'Network',
    (resourceId, environmentId) => new NetworkStateManager(resourceId, environmentId),
);

const app = new Hono();

app.get('/stream/:networkId', (c) => {
    const networkId = c.req.param('networkId');

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        let manager: NetworkStateManager;
        try {
            manager = await networkManagerRegistry.acquire(networkId, environmentId);
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
            networkManagerRegistry.release(networkId, environmentId);
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
