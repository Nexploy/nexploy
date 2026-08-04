export type TaskStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type TaskKind = 'container-migrate' | 'container-recreate' | 'image-pull' | 'image-mirror';

export type TaskStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface TaskStep {
    key: string;
    status: TaskStepStatus;
}

export interface Task {
    id: string;
    kind: TaskKind;
    status: TaskStatus;
    subjectName: string;
    environmentId?: string;
    targetEnvironmentId?: string;
    steps: TaskStep[];
    currentStepKey: string | null;
    progress: number;
    warnings: string[];
    error?: string;
    cancellable: boolean;
    resultHref?: string;
    startedAt: number;
    finishedAt?: number;
}

export type TasksEventType = 'initial-state' | 'task-created' | 'task-updated' | 'task-removed' | 'heartbeat';

export interface TasksEvent {
    type: TasksEventType;
    task?: Task;
    taskId?: string;
    tasks?: Task[];
    timestamp: number;
}

export interface TasksStats {
    total: number;
    running: number;
}
