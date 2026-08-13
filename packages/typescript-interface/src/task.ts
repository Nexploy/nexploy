export type TaskStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type TaskKind =
    | 'container-migrate'
    | 'container-recreate'
    | 'container-create'
    | 'container-rename'
    | 'container-restart-policy'
    | 'container-start'
    | 'container-stop'
    | 'container-restart'
    | 'container-pause'
    | 'container-unpause'
    | 'container-remove'
    | 'container-prune'
    | 'image-pull'
    | 'image-push'
    | 'image-mirror'
    | 'image-tag'
    | 'image-untag'
    | 'image-import'
    | 'image-load'
    | 'image-save'
    | 'image-remove'
    | 'image-prune'
    | 'network-create'
    | 'network-remove'
    | 'network-prune'
    | 'volume-create'
    | 'volume-remove'
    | 'volume-prune'
    | 'volume-import'
    | 'stack-start'
    | 'stack-stop'
    | 'stack-restart'
    | 'stack-pause'
    | 'stack-unpause'
    | 'stack-remove'
    | 'build-pipeline'
    | 'system-prune-containers'
    | 'system-prune-images'
    | 'system-prune-volumes'
    | 'system-prune-build'
    | 'system-prune-all'
    | 'stack-deploy'
    | 'swarm-init'
    | 'swarm-join'
    | 'swarm-leave'
    | 'swarm-node-promote'
    | 'swarm-node-demote'
    | 'swarm-node-drain'
    | 'swarm-node-activate'
    | 'swarm-node-pause'
    | 'swarm-node-remove'
    | 'swarm-service-create'
    | 'swarm-service-update'
    | 'swarm-service-scale'
    | 'swarm-service-force-update'
    | 'swarm-service-remove';

export type TaskResource = 'container' | 'image' | 'network' | 'volume' | 'build' | 'setting' | 'swarm';

export type TaskStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface TaskStep {
    key: string;
    status: TaskStepStatus;
    label?: string;
}

export interface Task {
    id: string;
    kind: TaskKind;
    status: TaskStatus;
    subjectName: string;
    subjectId?: string;
    environmentId?: string;
    targetEnvironmentId?: string;
    ownerOrganizationId: string | null;
    steps: TaskStep[];
    currentStepKey: string | null;
    progress: number;
    warnings: string[];
    error?: string;
    cancellable: boolean;
    silent: boolean;
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
