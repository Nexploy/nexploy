import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getDockerStatusManager } from '@/managers/dockerStatusManager';
import { logger } from '@/utils/logger';
import { DockerStatusEvent, Event } from '@workspace/typescript-interface/docker/docker.status';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getDockerStatusManager();

    return streamSSE(c, async (stream) => {
        let isActive = true;
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const initialData: DockerStatusEvent = {
            type: 'initial',
            status: manager.getStatus(),
            isConnected: manager.isConnected(),
            lastCheck: manager.getLastCheck(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialData),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        const sendEvent = async (event: Event, data: DockerStatusEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(data),
                    event,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err }, 'Error sending docker-connecting');
                cleanup();
            }
        };

        const onStatusChange = (data: any) => sendEvent('status-changed', data);

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: DockerStatusEvent = {
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
            if (!isActive) return;
            isActive = false;
            clearInterval(heartbeat);
            manager.off('status-changed', onStatusChange);
        };

        manager.on('status-changed', onStatusChange);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
