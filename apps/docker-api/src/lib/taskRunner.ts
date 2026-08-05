import { TaskKind, TaskStepStatus } from '@workspace/typescript-interface/task';
import { TaskCancelledError, tasksManager } from '@/managers/tasksManager';
import { getCurrentActor, isUserAction } from '@/lib/actorContext';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { logger } from '@/utils/logger';

export interface TaskContext {
    taskId: string;
    signal: AbortSignal;
    step: (stepKey: string) => void;
    completeStep: (stepKey: string, status?: Exclude<TaskStepStatus, 'pending' | 'running'>) => void;
    setProgress: (progress: number) => void;
    warn: (message: string) => void;
    assertNotCancelled: () => void;
    lockCancellation: () => void;
}

export interface RunAsTaskInput<T> {
    kind: TaskKind;
    subjectName: string;
    stepKeys: string[];
    environmentId?: string;
    targetEnvironmentId?: string;
    ownerOrganizationId?: string | null;
    cancellable?: boolean;
    run: (context: TaskContext) => Promise<T>;
    resultHref?: (result: T) => string | undefined;
}

export interface StartedTask {
    taskId: string;
    name: string;
}

export function runAsTask<T>({
    kind,
    subjectName,
    stepKeys,
    environmentId,
    targetEnvironmentId,
    ownerOrganizationId,
    cancellable = false,
    run,
    resultHref,
}: RunAsTaskInput<T>): StartedTask {
    const { task, signal } = tasksManager.create({
        kind,
        subjectName,
        stepKeys,
        environmentId,
        targetEnvironmentId,
        ownerOrganizationId: ownerOrganizationId ?? getCurrentActor().organizationId,
        cancellable,
    });

    const context: TaskContext = {
        taskId: task.id,
        signal,
        step: (stepKey) => tasksManager.startStep(task.id, stepKey),
        completeStep: (stepKey, status = 'done') => tasksManager.completeStep(task.id, stepKey, status),
        setProgress: (progress) => tasksManager.setProgress(task.id, progress),
        warn: (message) => tasksManager.addWarning(task.id, message),
        assertNotCancelled: () => {
            if (signal.aborted) throw new TaskCancelledError();
        },
        lockCancellation: () => tasksManager.lockCancellation(task.id),
    };

    void run(context)
        .then((result) => {
            tasksManager.finish(task.id, 'succeeded', { resultHref: resultHref?.(result) });
        })
        .catch((err: unknown) => {
            if (err instanceof TaskCancelledError) {
                tasksManager.finish(task.id, 'cancelled');
                return;
            }

            const message = err instanceof Error ? err.message : String(err);
            logger.error({ err, taskId: task.id, kind }, 'Task failed');
            tasksManager.finish(task.id, 'failed', { error: message });
        });

    return { taskId: task.id, name: subjectName };
}

export interface TrackedTaskContext {
    setProgress: (progress: number) => void;
    warn: (message: string) => void;
}

export interface RunTrackedTaskInput<T> {
    kind: TaskKind;
    subjectName: string;
    resolveOwner?: () => Promise<string | null>;
    run: (context: TrackedTaskContext) => Promise<T>;
    resultHref?: (result: T) => string | undefined;
}

const UNTRACKED_CONTEXT: TrackedTaskContext = {
    setProgress: () => {},
    warn: () => {},
};

export async function runTrackedTask<T>({
    kind,
    subjectName,
    resolveOwner,
    run,
    resultHref,
}: RunTrackedTaskInput<T>): Promise<T> {
    if (!isUserAction()) {
        return run(UNTRACKED_CONTEXT);
    }

    const { task } = tasksManager.create({
        kind,
        subjectName,
        stepKeys: [],
        environmentId: getCurrentEnvironmentId(),
        ownerOrganizationId: (await resolveOwner?.()) ?? getCurrentActor().organizationId,
        silent: true,
    });

    try {
        const result = await run({
            setProgress: (progress) => tasksManager.setProgress(task.id, progress),
            warn: (message) => tasksManager.addWarning(task.id, message),
        });

        tasksManager.finish(task.id, 'succeeded', { resultHref: resultHref?.(result) });

        return result;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ err, taskId: task.id, kind }, 'Tracked task failed');
        tasksManager.finish(task.id, 'failed', { error: message });

        throw err;
    }
}
