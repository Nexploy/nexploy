import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getVolumesStateManager } from '@/managers/list/volumesStateManager';
import { logger } from '@/utils/logger';
import { VolumeEvent } from '@workspace/typescript-interface/docker/docker.volume';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getVolumesStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

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
                cleanup();
            }
        }, 15000);

        const cleanup = () => {
            manager.off('state-change', handleStateChange);
            manager.off('initial-state', handleInitialState);
            manager.off('volume-added', handleVolumeAdded);
            manager.off('volume-updated', handleVolumeUpdated);
            manager.off('volume-removed', handleVolumeRemoved);

            clearInterval(heartbeat);
        };

        const initialVolumes = manager.getAllVolumes();

        await handleInitialState({
            type: 'initial',
            volumes: initialVolumes,
            timestamp: Date.now(),
        });

        manager.on('state-change', handleStateChange);
        manager.on('initial-state', handleInitialState);
        manager.on('volume-added', handleVolumeAdded);
        manager.on('volume-updated', handleVolumeUpdated);
        manager.on('volume-removed', handleVolumeRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
