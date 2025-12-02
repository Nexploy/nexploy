import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { TraefikRequestEvent } from '@workspace/typescript-interface/traefik/traefik.request';
import { traefikLogsManager } from '@/managers/traefikLogsManager';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Traefik client connected');

        const handleRequest = async (event: TraefikRequestEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'request',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending request event');
                cleanup();
            }
        };

        const handleClear = async (event: TraefikRequestEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'clear',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending clear event');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData: TraefikRequestEvent = {
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
            clearInterval(heartbeat);
            traefikLogsManager.off('request', handleRequest);
            traefikLogsManager.off('clear', handleClear);
            logger.info({ clientId }, 'SSE Traefik client disconnected');
        };

        const requests = traefikLogsManager.getRequests();
        const initialEvent: TraefikRequestEvent = {
            type: 'initial',
            requests,
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialEvent),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        traefikLogsManager.on('request', handleRequest);
        traefikLogsManager.on('clear', handleClear);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
