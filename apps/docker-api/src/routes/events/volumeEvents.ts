import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { VolumeStateManager } from '@/managers/volumeStateManager';
import { VolumeDetailEvent } from '@workspace/typescript-interface/docker/docker.volume';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';

const app = new Hono();

app.get('/stream/:volumeName', (c) => {
    const volumeName = decodeURIComponent(c.req.param('volumeName'));

    const environmentId =
        getCurrentEnvironmentId() || dockerClientRegistry.getDefaultEnvironmentId()!;
    const manager = new VolumeStateManager(volumeName, environmentId);

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        try {
            await manager.start();
        } catch (err) {
            logger.error({ err, clientId, volumeName }, 'Failed to start volume monitor');
            await stream.writeSSE({
                data: JSON.stringify({ error: 'Failed to start monitoring' }),
                event: 'error',
                id: `${Date.now()}`,
            });
            return;
        }

        const handleInitialState = async (event: VolumeDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'initial-state',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, volumeName }, 'Error sending initial-state');
                cleanup();
            }
        };

        const handleStateChange = async (event: VolumeDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'state-change',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, volumeName }, 'Error sending state-change');
                cleanup();
            }
        };

        const handleRemoved = async (event: VolumeDetailEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'removed',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, volumeName }, 'Error sending removed');
                cleanup();
            }
        };

        const handleNotFound = async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'not-found', volumeName, timestamp: Date.now() }),
                    event: 'not-found',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, volumeName }, 'Error sending not-found');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', volumeName, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, volumeName }, 'Error sending heartbeat');
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
                volumeName,
                volume: currentState,
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
