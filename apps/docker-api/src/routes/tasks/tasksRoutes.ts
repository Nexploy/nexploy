import { Hono } from 'hono';
import { clearTasksBodySchema, taskIdSchema } from '@workspace/schemas-zod/task/task.schema';
import { route } from '@/utils/route';
import { HttpError } from '@nexploy/shared/http-error';
import { tasksManager } from '@/managers/tasksManager';

const app = new Hono();

app.get(
    '/current',
    route(async () => {
        return {
            tasks: tasksManager.list(),
            stats: tasksManager.getStats(),
            timestamp: Date.now(),
        };
    }),
);

app.get(
    '/:taskId',
    route({ param: taskIdSchema }, async (c) => {
        const { taskId } = c.req.valid('param');
        const task = tasksManager.get(taskId);

        if (!task) {
            throw new HttpError(`Task not found: ${taskId}`, 404);
        }

        return task;
    }),
);

app.post(
    '/:taskId/cancel',
    route({ param: taskIdSchema }, async (c) => {
        const { taskId } = c.req.valid('param');

        if (!tasksManager.get(taskId)) {
            throw new HttpError(`Task not found: ${taskId}`, 404);
        }

        if (!tasksManager.cancel(taskId)) {
            throw new HttpError('This task cannot be cancelled.', 409);
        }

        return { cancelled: true, taskId };
    }),
);

app.delete(
    '/:taskId',
    route({ param: taskIdSchema }, async (c) => {
        const { taskId } = c.req.valid('param');

        if (!tasksManager.remove(taskId)) {
            throw new HttpError('A running task cannot be dismissed.', 409);
        }

        return { removed: true, taskId };
    }),
);

app.post(
    '/clear',
    route({ json: clearTasksBodySchema }, async (c) => {
        const { taskIds } = c.req.valid('json');

        return { removed: tasksManager.clearFinished(taskIds) };
    }),
);

export default app;
