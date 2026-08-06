'use server';

import { HTTPError } from 'ky';
import { taskIdSchema } from '@workspace/schemas-zod/task/task.schema';
import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { requireManageableTask } from '@/lib/tasks/requireManageableTask';
import { cancelBuildRepository } from '@/services/repository/build.service';

export const onTaskCancelAction = authActionServer
    .metadata({ name: 'tasks.cancel' })
    .inputSchema(taskIdSchema)
    .action(async ({ parsedInput: { taskId }, ctx }) => {
        try {
            const task = await requireManageableTask(taskId, ctx.session);

            if (task.kind === 'build-pipeline') {
                if (task.subjectId) await cancelBuildRepository(task.subjectId);

                return { cancelled: true, taskId };
            }

            return await kyDocker.post(`tasks/${taskId}/cancel`).json<{ cancelled: boolean; taskId: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }

            throw err;
        }
    });
