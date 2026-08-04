'use server';

import { z } from 'zod';
import { HTTPError } from 'ky';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';

const taskIdSchema = z.object({
    taskId: z.string().min(1),
});

const reportError = async (err: unknown) => {
    if (err instanceof HTTPError) {
        await setToastServer({ type: 'error', message: err.message as string });
    }
    throw err;
};

export const onTaskCancelAction = authActionServer
    .use(requirePermission('container', 'manage', HOST_SCOPED))
    .inputSchema(taskIdSchema)
    .action(async ({ parsedInput: { taskId } }) => {
        try {
            return await kyDocker.post(`tasks/${taskId}/cancel`).json<{ cancelled: boolean; taskId: string }>();
        } catch (err: unknown) {
            return reportError(err);
        }
    });

export const onTaskDismissAction = authActionServer
    .use(requirePermission('container', 'manage', HOST_SCOPED))
    .inputSchema(taskIdSchema)
    .action(async ({ parsedInput: { taskId } }) => {
        try {
            return await kyDocker.delete(`tasks/${taskId}`).json<{ removed: boolean; taskId: string }>();
        } catch (err: unknown) {
            return reportError(err);
        }
    });

export const onTasksClearAction = authActionServer
    .use(requirePermission('container', 'manage', HOST_SCOPED))
    .inputSchema(z.object({}))
    .action(async () => {
        try {
            return await kyDocker.post('tasks/clear').json<{ removed: number }>();
        } catch (err: unknown) {
            return reportError(err);
        }
    });
