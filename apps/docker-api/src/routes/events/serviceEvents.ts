import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getSwarmStateManager } from '@/managers/swarmStateManager';
import type {
    ServiceDetailEvent,
    SwarmEvent,
} from '@workspace/typescript-interface/docker/swarm';

const app = new Hono();

app.get('/stream/:serviceId', (c) => {
    const serviceId = decodeURIComponent(c.req.param('serviceId'));
    const manager = getSwarmStateManager();

    return streamSSE(c, async (stream) => {
        const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const sendEvent = async (event: ServiceDetailEvent, eventName: string) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: eventName,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, serviceId }, `Error sending ${eventName}`);
                cleanup();
            }
        };

        const handleServiceUpdated = (event: SwarmEvent) => {
            if (event.type !== 'service-updated' || event.service.id !== serviceId) return;
            const tasks = manager.getTasksByService(serviceId);
            sendEvent(
                { type: 'service-updated', serviceId, service: event.service, tasks, timestamp: event.timestamp },
                'service-updated',
            );
        };

        const handleServiceRemoved = (event: SwarmEvent) => {
            if (event.type !== 'service-removed' || event.serviceId !== serviceId) return;
            sendEvent({ type: 'service-removed', serviceId, timestamp: event.timestamp }, 'service-removed');
        };

        const handleTaskAdded = (event: SwarmEvent) => {
            if (event.type !== 'task-added' || event.task.serviceId !== serviceId) return;
            const service = manager.getService(serviceId);
            const tasks = manager.getTasksByService(serviceId);
            sendEvent(
                { type: 'task-added', serviceId, service, tasks, timestamp: event.timestamp },
                'task-added',
            );
        };

        const handleTaskUpdated = (event: SwarmEvent) => {
            if (event.type !== 'task-updated' || event.task.serviceId !== serviceId) return;
            const service = manager.getService(serviceId);
            const tasks = manager.getTasksByService(serviceId);
            sendEvent(
                { type: 'task-updated', serviceId, service, tasks, timestamp: event.timestamp },
                'task-updated',
            );
        };

        const handleTaskRemoved = (event: SwarmEvent) => {
            if (event.type !== 'task-removed' || event.previousTask.serviceId !== serviceId) return;
            const service = manager.getService(serviceId);
            const tasks = manager.getTasksByService(serviceId);
            sendEvent(
                { type: 'task-removed', serviceId, service, tasks, timestamp: event.timestamp },
                'task-removed',
            );
        };

        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'heartbeat', serviceId, timestamp: Date.now() }),
                    event: 'heartbeat',
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, serviceId }, 'Error sending heartbeat');
                clearInterval(heartbeat);
                cleanup();
            }
        }, 30000);

        const cleanup = () => {
            clearInterval(heartbeat);
            manager.off('service-updated', handleServiceUpdated);
            manager.off('service-removed', handleServiceRemoved);
            manager.off('task-added', handleTaskAdded);
            manager.off('task-updated', handleTaskUpdated);
            manager.off('task-removed', handleTaskRemoved);
        };

        manager.on('service-updated', handleServiceUpdated);
        manager.on('service-removed', handleServiceRemoved);
        manager.on('task-added', handleTaskAdded);
        manager.on('task-updated', handleTaskUpdated);
        manager.on('task-removed', handleTaskRemoved);

        const service = manager.getService(serviceId);
        const tasks = manager.getTasksByService(serviceId);

        if (!manager.getIsSwarmActive() || !service) {
            await sendEvent({ type: 'not-found', serviceId, timestamp: Date.now() }, 'not-found');
        } else {
            await sendEvent(
                { type: 'initial-state', serviceId, service, tasks, timestamp: Date.now() },
                'initial-state',
            );
        }

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
