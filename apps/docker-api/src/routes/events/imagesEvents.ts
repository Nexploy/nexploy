import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { logger } from '@/utils/logger';
import { ImageEvent } from '@workspace/typescript-interface/docker/docker.image';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Image client connected');

        const handleInitialState = async (imageEvent: ImageEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(imageEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleImageAdded = async (imageEvent: ImageEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(imageEvent),
                event: 'image-added',
                id: `${Date.now()}`,
            });
        };

        const handleImageUpdated = async (imageEvent: ImageEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(imageEvent),
                event: 'image-updated',
                id: `${Date.now()}`,
            });
        };

        const handleImageRemoved = async (imageEvent: ImageEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(imageEvent),
                event: 'image-removed',
                id: `${Date.now()}`,
            });
        };

        const handleStateChange = async (imageEvent: ImageEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(imageEvent),
                event: 'state-change',
                id: `${Date.now()}`,
            });
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: ImageEvent = {
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
            logger.info('Client disconnected from image events stream');

            imagesStateManager.off('state-change', handleStateChange);
            imagesStateManager.off('initial-state', handleInitialState);
            imagesStateManager.off('image-added', handleImageAdded);
            imagesStateManager.off('image-updated', handleImageUpdated);
            imagesStateManager.off('image-removed', handleImageRemoved);

            logger.info({ clientId }, 'SSE Image client disconnected');
        };

        const initialImages = imagesStateManager.getAllImages();
        await handleInitialState({
            type: 'initial',
            images: initialImages,
            timestamp: Date.now(),
        });

        imagesStateManager.on('state-change', handleStateChange);
        imagesStateManager.on('initial-state', handleInitialState);
        imagesStateManager.on('image-added', handleImageAdded);
        imagesStateManager.on('image-updated', handleImageUpdated);
        imagesStateManager.on('image-removed', handleImageRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
