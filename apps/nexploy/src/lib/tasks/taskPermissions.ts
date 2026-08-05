import type { Task, TaskKind, TaskResource } from '@workspace/typescript-interface/task';
import { isPrivilegedViewer } from '@nexploy/shared/ownership';
import { hasPermission } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';

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
    'image-mirror': 'image',
    'image-tag': 'image',
    'image-remove': 'image',
    'image-prune': 'image',
    'network-create': 'network',
    'network-remove': 'network',
    'volume-create': 'volume',
    'volume-remove': 'volume',
    'volume-prune': 'volume',
    'stack-start': 'container',
    'stack-stop': 'container',
    'stack-restart': 'container',
    'stack-pause': 'container',
    'stack-unpause': 'container',
    'stack-remove': 'container',
};

export function getTaskResource(kind: TaskKind): TaskResource {
    return TASK_KIND_RESOURCE[kind];
}

export interface TaskViewer {
    role: string;
    orgRole: string | null;
    organizationId: string | null;
}

export function ownsTask(viewer: TaskViewer, task: Task): boolean {
    if (isPrivilegedViewer({ role: viewer.role, organizationId: viewer.organizationId })) return true;
    if (!task.ownerOrganizationId) return true;

    return task.ownerOrganizationId === viewer.organizationId;
}

export function canOnTaskResource(viewer: TaskViewer, resource: TaskResource, action: string): boolean {
    if (hasPermission(viewer.role, resource, action)) return true;

    return (
        isOrgScopedResource(resource) &&
        !!viewer.orgRole &&
        hasOrgPermission(viewer.orgRole, resource as OrgPermissionResource, action)
    );
}

export function canReadTask(viewer: TaskViewer, task: Task): boolean {
    return ownsTask(viewer, task) && canOnTaskResource(viewer, getTaskResource(task.kind), 'read');
}

export function canManageTask(viewer: TaskViewer, task: Task): boolean {
    return ownsTask(viewer, task) && canOnTaskResource(viewer, getTaskResource(task.kind), 'manage');
}
