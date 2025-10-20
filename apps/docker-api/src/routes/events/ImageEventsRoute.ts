import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { imageStateManager } from '@/services/imageStateManager';
import { logger } from '@/utils/logger';

const app = new Hono();

app.get('/stream', (c) => {
    logger.info('Client connected to image events stream');

    return streamSSE(c, async (stream) => {
        const initialImages = imageStateManager.getAllStates();
        const initialStateData = {
            type: 'initial',
            images: initialImages,
            timestamp: Date.now(),
        };
        await stream.writeSSE({
            data: JSON.stringify(initialStateData),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        const heartbeatInterval = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: 'heartbeat',
                    event: 'ping',
                });
            } catch (err) {
                logger.error({ err }, 'Error sending heartbeat');
                clearInterval(heartbeatInterval);
            }
        }, 15000);

        const onImageAdded = async (image: any) => {
            const eventData = {
                type: 'added',
                image,
                timestamp: Date.now(),
            };
            await stream.writeSSE({
                data: JSON.stringify(eventData),
                event: 'image-added',
                id: `${Date.now()}`,
            });
        };

        const onImageUpdated = async ({ oldState, newState }: any) => {
            const eventData = {
                type: 'updated',
                image: newState,
                oldImage: oldState,
                timestamp: Date.now(),
            };
            await stream.writeSSE({
                data: JSON.stringify(eventData),
                event: 'image-updated',
                id: `${Date.now()}`,
            });
        };

        const onImageRemoved = async ({ id, oldState }: any) => {
            const eventData = {
                type: 'removed',
                id,
                image: oldState,
                timestamp: Date.now(),
            };
            await stream.writeSSE({
                data: JSON.stringify(eventData),
                event: 'image-removed',
                id: `${Date.now()}`,
            });
        };

        const onStateChange = async (data: any) => {
            const eventData = {
                type: 'state-change',
                changeType: data.type,
                image: data.image,
                changes: data.changes,
                timestamp: Date.now(),
            };
            await stream.writeSSE({
                data: JSON.stringify(eventData),
                event: 'state-change',
                id: `${Date.now()}`,
            });
        };

        imageStateManager.on('image-added', onImageAdded);
        imageStateManager.on('image-updated', onImageUpdated);
        imageStateManager.on('image-removed', onImageRemoved);
        imageStateManager.on('state-change', onStateChange);

        stream.onAbort(() => {
            logger.info('Client disconnected from image events stream');
            imageStateManager.off('image-added', onImageAdded);
            imageStateManager.off('image-updated', onImageUpdated);
            imageStateManager.off('image-removed', onImageRemoved);
            imageStateManager.off('state-change', onStateChange);
            clearInterval(heartbeatInterval);
        });
    });
});

export default app;
