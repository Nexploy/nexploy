import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { Task, TasksEvent } from '@workspace/typescript-interface/task';
import { logger } from '@/utils/logger';
import { tasksManager } from '@/managers/tasksManager';

const HEARTBEAT_INTERVAL_MS = 15000;

const app = new Hono();

app.get('/stream', (c) => {
    return streamSSE(c, async (stream) => {
        const clientId = c.req.header('x-client-id');

        const send = async (event: TasksEvent['type'], payload: Omit<TasksEvent, 'type' | 'timestamp'>) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify({ type: event, ...payload, timestamp: Date.now() } satisfies TasksEvent),
                    event,
                    id: `${Date.now()}`,
                });
            } catch (err) {
                logger.error({ err, clientId, event }, 'Error sending task event');
                cleanup();
            }
        };

        const handleCreated = (task: Task) => send('task-created', { task });
        const handleUpdated = (task: Task) => send('task-updated', { task });
        const handleRemoved = (taskId: string) => send('task-removed', { taskId });

        const heartbeat = setInterval(() => {
            void send('heartbeat', {});
        }, HEARTBEAT_INTERVAL_MS);

        const cleanup = () => {
            clearInterval(heartbeat);
            tasksManager.off('task-created', handleCreated);
            tasksManager.off('task-updated', handleUpdated);
            tasksManager.off('task-removed', handleRemoved);
        };

        await send('initial-state', { tasks: tasksManager.list() });

        tasksManager.on('task-created', handleCreated);
        tasksManager.on('task-updated', handleUpdated);
        tasksManager.on('task-removed', handleRemoved);

        c.req.raw.signal.addEventListener('abort', cleanup);

        await stream.sleep(2_147_483_647);
    });
});

export default app;
