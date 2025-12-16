import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { EventsStateEvent } from '@workspace/typescript-interface/docker/docker.events';
import { getEventsStateManager } from '@/managers/eventsStateManager';

const app = new Hono();

app.get('/stream', (c) => {
    const manager = getEventsStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
                    stats: manager.getStats(),
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

            manager.off('docker-event', handleDockerEvent);
        };

        const initialStats = {
            type: 'initial',
            stats: manager.getStats(),
            events: manager.getAllEvents(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        manager.on('docker-event', handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:eventType', (c) => {
    const eventType = c.req.param('eventType');

    const manager = getEventsStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
                    stats: manager.getStats(),
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

            manager.off(`docker-event:${eventType}`, handleDockerEvent);
        };

        const initialStats = {
            type: 'initial',
            eventType,
            stats: manager.getStats(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        manager.on(`docker-event:${eventType}`, handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

app.get('/stream/:eventType/:action', (c) => {
    const eventType = c.req.param('eventType');
    const action = c.req.param('action');

    const manager = getEventsStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
                    stats: manager.getStats(),
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

            manager.off(`docker-event:${eventType}:${action}`, handleDockerEvent);
        };

        const initialStats = {
            type: 'initial',
            eventType,
            action,
            stats: manager.getStats(),
            timestamp: Date.now(),
        };

        await stream.writeSSE({
            data: JSON.stringify(initialStats),
            event: 'initial-state',
            id: `${Date.now()}`,
        });

        manager.on(`docker-event:${eventType}:${action}`, handleDockerEvent);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
