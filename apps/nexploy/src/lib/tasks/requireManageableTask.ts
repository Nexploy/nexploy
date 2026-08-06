import { getTranslations } from 'next-intl/server';
import type { Task } from '@workspace/typescript-interface/task';
import type { Session } from '@/lib/auth/auth';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { ForbiddenError } from '@/lib/activity/forbiddenError';
import { resolveTaskViewer } from '@/lib/tasks/taskVisibility';
import { canManageTask } from '@/lib/tasks/taskPermissions';
import { isBuildTaskId, toBuildIdFromTaskId } from '@/lib/tasks/buildTask';
import { getBuildTask } from '@/services/repository/buildTask.service';

async function resolveTask(taskId: string): Promise<Task | null> {
    if (isBuildTaskId(taskId)) {
        return getBuildTask(toBuildIdFromTaskId(taskId));
    }

    return kyDocker.get(`tasks/${taskId}`).json<Task>();
}

export async function requireManageableTask(taskId: string, session: Session): Promise<Task> {
    const task = await resolveTask(taskId);
    const viewer = await resolveTaskViewer(session);

    if (!task || !canManageTask(viewer, task)) {
        const t = await getTranslations('common');
        await setToastServer({ type: 'error', message: t('forbidden') });
        throw new ForbiddenError(t('forbidden'));
    }

    return task;
}
