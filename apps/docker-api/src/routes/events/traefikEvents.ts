import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { TraefikRequestEvent } from '@workspace/typescript-interface/traefik/traefik.request';
import { getTraefikLogsManager } from '@/managers/traefikLogsManager';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getTraefikLogsManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
            manager.off('request', handleRequest);
            manager.off('clear', handleClear);
        };

        const requests = manager.getRequests();
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

        manager.on('request', handleRequest);
        manager.on('clear', handleClear);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
