import { Hono } from 'hono';
import { z } from 'zod';
import { route } from '@/utils/route';
import { HttpError } from '@nexploy/shared/http-error';
import { tasksManager } from '@/managers/tasksManager';

const taskIdParamSchema = z.object({
    taskId: z.string().min(1),
});

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

app.post(
    '/:taskId/cancel',
    route({ param: taskIdParamSchema }, async (c) => {
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
    route({ param: taskIdParamSchema }, async (c) => {
        const { taskId } = c.req.valid('param');

        if (!tasksManager.remove(taskId)) {
            throw new HttpError('A running task cannot be dismissed.', 409);
        }

        return { removed: true, taskId };
    }),
);

app.post(
    '/clear',
    route(async () => {
        return { removed: tasksManager.clearFinished() };
    }),
);

export default app;
