import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getImagesStateManager } from '@/managers/list/imagesStateManager';
import { logger } from '@/utils/logger';
import { ImageEvent } from '@workspace/typescript-interface/docker/docker.image';
import { createInitialStateGate } from '@/utils/initialStateGate';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getImagesStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

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

        const gate = createInitialStateGate();
        const onInitialState = gate.gate(handleInitialState);
        const onStateChange = gate.gate(handleStateChange);
        const onImageAdded = gate.gate(handleImageAdded);
        const onImageUpdated = gate.gate(handleImageUpdated);
        const onImageRemoved = gate.gate(handleImageRemoved);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('state-change', onStateChange);
            manager.off('initial-state', onInitialState);
            manager.off('image-added', onImageAdded);
            manager.off('image-updated', onImageUpdated);
            manager.off('image-removed', onImageRemoved);
        };

        manager.on('state-change', onStateChange);
        manager.on('initial-state', onInitialState);
        manager.on('image-added', onImageAdded);
        manager.on('image-updated', onImageUpdated);
        manager.on('image-removed', onImageRemoved);

        const initialImages = manager.getAllImages();
        await handleInitialState({
            type: 'initial',
            images: initialImages,
            timestamp: Date.now(),
        });
        await gate.release();

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
