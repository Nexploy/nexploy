import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { logger } from '@/utils/logger';
import { ImageEvent } from '@workspace/typescript-interface/docker/docker.image';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getImagesStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
                cleanup();
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('state-change', handleStateChange);
            manager.off('initial-state', handleInitialState);
            manager.off('image-added', handleImageAdded);
            manager.off('image-updated', handleImageUpdated);
            manager.off('image-removed', handleImageRemoved);
        };

        const initialImages = manager.getAllImages();
        await handleInitialState({
            type: 'initial',
            images: initialImages,
            timestamp: Date.now(),
        });

        manager.on('state-change', handleStateChange);
        manager.on('initial-state', handleInitialState);
        manager.on('image-added', handleImageAdded);
        manager.on('image-updated', handleImageUpdated);
        manager.on('image-removed', handleImageRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
