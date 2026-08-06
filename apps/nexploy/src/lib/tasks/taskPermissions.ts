import type { Task, TaskKind, TaskResource } from '@workspace/typescript-interface/task';
import { canOnOwnedResource, type ResourceViewer } from '@/lib/auth/canOnOwnedResource';

const TASK_KIND_RESOURCE: Record<TaskKind, TaskResource> = {
    'container-migrate': 'container',
    'container-recreate': 'container',
    'container-create': 'container',
    'container-rename': 'container',
    'container-restart-policy': 'container',
    'container-start': 'container',
    'container-stop': 'container',
    'container-restart': 'container',
    'container-pause': 'container',
    'container-unpause': 'container',
    'container-remove': 'container',
    'container-prune': 'container',
    'image-pull': 'image',
    'image-push': 'image',
    'image-mirror': 'image',
    'image-tag': 'image',
    'image-untag': 'image',
    'image-import': 'image',
    'image-load': 'image',
    'image-save': 'image',
    'image-remove': 'image',
    'image-prune': 'image',
    'network-create': 'network',
    'network-remove': 'network',
    'network-prune': 'network',
    'volume-create': 'volume',
    'volume-remove': 'volume',
    'volume-prune': 'volume',
    'stack-start': 'container',
    'stack-stop': 'container',
    'stack-restart': 'container',
    'stack-pause': 'container',
    'stack-unpause': 'container',
    'stack-remove': 'container',
    'build-pipeline': 'build',
};

const TASK_MANAGE_ACTION: Partial<Record<TaskResource, string>> = {
    build: 'cancel',
};

export function getTaskResource(kind: TaskKind): TaskResource {
    return TASK_KIND_RESOURCE[kind];
}

export type TaskViewer = ResourceViewer;

export function canOnTask(viewer: TaskViewer, task: Task, action: string): boolean {
    return canOnOwnedResource(viewer, getTaskResource(task.kind), action, task.ownerOrganizationId);
}

export function canReadTask(viewer: TaskViewer, task: Task): boolean {
    return canOnTask(viewer, task, 'read');
}

export function canManageTask(viewer: TaskViewer, task: Task): boolean {
    return canOnTask(viewer, task, TASK_MANAGE_ACTION[getTaskResource(task.kind)] ?? 'manage');
}
