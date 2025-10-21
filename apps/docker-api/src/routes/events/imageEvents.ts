import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { imageStateManager } from '@/services/imageStateManager';
import { logger } from '@/utils/logger';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Image client connected');

        const handleInitialState = async (images: any) => {
            try {
                const initialStateData = {
                    type: 'initial',
                    images,
                    timestamp: Date.now(),
                };
                await stream.writeSSE({
                    data: JSON.stringify(initialStateData),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleImageAdded = async (image: any) => {
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

        const handleImageUpdated = async ({ oldState, newState }: any) => {
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

        const handleImageRemoved = async ({ id, oldState }: any) => {
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

        const handleStateChange = async (data: any) => {
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

        const cleanup = () => {
            logger.info('Client disconnected from image events stream');

            imageStateManager.off('state-change', handleStateChange);
            imageStateManager.off('initial-state', handleInitialState);
            imageStateManager.off('image-added', handleImageAdded);
            imageStateManager.off('image-updated', handleImageUpdated);
            imageStateManager.off('image-removed', handleImageRemoved);

            logger.info({ clientId }, 'SSE Image client disconnected');
        };

        const initialImages = imageStateManager.getAllStates();
        await handleInitialState(initialImages);

        imageStateManager.on('state-change', handleStateChange);
        imageStateManager.on('initial-state', handleInitialState);
        imageStateManager.on('image-added', handleImageAdded);
        imageStateManager.on('image-updated', handleImageUpdated);
        imageStateManager.on('image-removed', handleImageRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
