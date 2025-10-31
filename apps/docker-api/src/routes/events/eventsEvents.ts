import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { EventsStateEvent } from '@workspace/typescript-interface/docker/docker.events';
import { eventsStateManager } from '@/managers/eventsStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId }, 'SSE Events client connected');

        const handleDockerEvent = async (eventData: EventsStateEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(eventData),
                    event: 'docker-event',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending docker-event');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                    stats: eventsStateManager.getStats(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            eventsStateManager.off('docker-event', handleDockerEvent);

            logger.info({ clientId }, 'SSE Events client disconnected');
        };

        const initialStats = {
            type: 'initial',
            stats: eventsStateManager.getStats(),
            events: eventsStateManager.getAllEvents(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        eventsStateManager.on('docker-event', handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:eventType', (c) => {
    const eventType = c.req.param('eventType');

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info({ clientId, eventType }, 'SSE Events client connected with filter');

        const handleDockerEvent = async (eventData: EventsStateEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(eventData),
                    event: `docker-event-${eventType}`,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, eventType }, 'Error sending filtered docker-event');
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData = {
                    type: 'heartbeat',
                    eventType,
                    timestamp: Date.now(),
                    stats: eventsStateManager.getStats(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            eventsStateManager.off(`docker-event:${eventType}`, handleDockerEvent);

            logger.info({ clientId, eventType }, 'SSE Events client disconnected (filtered)');
        };

        const initialStats = {
            type: 'initial',
            eventType,
            stats: eventsStateManager.getStats(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        eventsStateManager.on(`docker-event:${eventType}`, handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:eventType/:action', (c) => {
    const eventType = c.req.param('eventType');
    const action = c.req.param('action');

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        logger.info(
            { clientId, eventType, action },
            'SSE Events client connected with action filter',
        );

        const handleDockerEvent = async (eventData: EventsStateEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(eventData),
                    event: `docker-event-${eventType}-${action}`,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error(
                    { err, clientId, eventType, action },
                    'Error sending action-filtered docker-event',
                );
                cleanup();
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                const heartbeatData = {
                    type: 'heartbeat',
                    eventType,
                    action,
                    timestamp: Date.now(),
                    stats: eventsStateManager.getStats(),
                };

                await stream.writeSSE({
                    data: JSON.stringify(heartbeatData),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
            }
        }, 15000);

        const cleanup = () => {
            clearInterval(heartbeat);

            eventsStateManager.off(`docker-event:${eventType}:${action}`, handleDockerEvent);

            logger.info(
                { clientId, eventType, action },
                'SSE Events client disconnected (action-filtered)',
            );
        };

        const initialStats = {
            type: 'initial',
            eventType,
            action,
            stats: eventsStateManager.getStats(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        eventsStateManager.on(`docker-event:${eventType}:${action}`, handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
