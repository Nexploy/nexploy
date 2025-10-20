import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { dockerStatusManager } from '@/services/dockerStatusManager';
import { logger } from '@/utils/logger';
import { DockerStatusEvent, Event } from '@workspace/typescript-interface/docker.status';

const app = new Hono();

app.get('/stream', (c) =>
    streamSSE(c, async (stream) => {
        let isActive = true;
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Docker client connected');

        const initialData: DockerStatusEvent = {
            type: 'initial',
            status: dockerStatusManager.getStatus(),
            isConnected: dockerStatusManager.isConnected(),
            lastCheck: dockerStatusManager.getLastCheck(),
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
                const status = dockerStatusManager.getStatus();

                const heartbeatData: DockerStatusEvent = {
                    type: 'heartbeat',
                    status,
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
            if (!isActive) return;
            isActive = false;

            dockerStatusManager.off('status-changed', onStatusChange);

            logger.info({ clientId }, 'SSE Docker client disconnected');
        };

        dockerStatusManager.on('status-changed', onStatusChange);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    }),
);

export default app;
