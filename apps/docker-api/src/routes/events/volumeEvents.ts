import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { volumeStateManager } from '@/managers/volumeStateManager';
import { logger } from '@/utils/logger';
import { VolumeEvent } from '@workspace/typescript-interface/docker/docker.volume';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Volume client connected');

        const handleInitialState = async (volumeEvent: VolumeEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(volumeEvent),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending initial-state after reconnection');
                cleanup();
            }
        };

        const handleVolumeAdded = async (volumeEvent: VolumeEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(volumeEvent),
                event: 'volume-added',
                id: `${Date.now()}`,
            });
        };

        const handleVolumeUpdated = async (volumeEvent: VolumeEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(volumeEvent),
                event: 'volume-updated',
                id: `${Date.now()}`,
            });
        };

        const handleVolumeRemoved = async (volumeEvent: VolumeEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(volumeEvent),
                event: 'volume-removed',
                id: `${Date.now()}`,
            });
        };

        const handleStateChange = async (volumeEvent: VolumeEvent) => {
            await stream.writeSSE({
                data: JSON.stringify(volumeEvent),
                event: 'state-change',
                id: `${Date.now()}`,
            });
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: VolumeEvent = {
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
            logger.info('Client disconnected from volume events stream');

            volumeStateManager.off('state-change', handleStateChange);
            volumeStateManager.off('initial-state', handleInitialState);
            volumeStateManager.off('volume-added', handleVolumeAdded);
            volumeStateManager.off('volume-updated', handleVolumeUpdated);
            volumeStateManager.off('volume-removed', handleVolumeRemoved);

            clearInterval(heartbeat);

            logger.info({ clientId }, 'SSE Volume client disconnected');
        };

        const initialVolumes = volumeStateManager.getAllVolumes();

        await handleInitialState({
            type: 'initial',
            volumes: initialVolumes,
            timestamp: Date.now(),
        });

        volumeStateManager.on('state-change', handleStateChange);
        volumeStateManager.on('initial-state', handleInitialState);
        volumeStateManager.on('volume-added', handleVolumeAdded);
        volumeStateManager.on('volume-updated', handleVolumeUpdated);
        volumeStateManager.on('volume-removed', handleVolumeRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
