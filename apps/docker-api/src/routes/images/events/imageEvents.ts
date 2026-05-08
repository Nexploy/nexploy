import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { ImageStateManager } from '@/managers/detail/imageStateManager';
import { ImageDetailEvent } from '@workspace/typescript-interface/docker/docker.image';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { SingleResourceManagerRegistry } from '@/lib/SingleResourceManagerRegistry';

const imageManagerRegistry = new SingleResourceManagerRegistry(
    'Image',
    (resourceId, environmentId) => new ImageStateManager(resourceId, environmentId),
);

const app = new Hono();

app.get('/stream/:imageId', (c) => {
    const imageId = c.req.param('imageId');

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        let manager: ImageStateManager;
        try {
            manager = await imageManagerRegistry.acquire(imageId, environmentId);
        } catch (err) {
            logger.error({ err, clientId, imageId }, 'Failed to start image monitor');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start monitoring' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleInitialState = async (event: ImageDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, imageId }, 'Error sending initial-state');
                cleanup();
            }
        };

        const handleStateChange = async (event: ImageDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, imageId }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleRemoved = async (event: ImageDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, imageId }, 'Error sending removed');
                cleanup();
            }
        };

        const handleNotFound = async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'not-found', imageId, timestamp: Date.now() }),
                    event: 'not-found',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, imageId }, 'Error sending not-found');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', imageId, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, imageId }, 'Error sending heartbeat');
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
            imageManagerRegistry.release(imageId, environmentId);
        };

        manager.on('initial-state', handleInitialState);
        manager.on('state-change', handleStateChange);
        manager.on('removed', handleRemoved);
        manager.on('not-found', handleNotFound);

        const currentState = manager.getCurrentState();
        if (currentState) {
            await handleInitialState({
                type: 'initial-state',
                imageId,
                image: currentState,
                history: [],
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
