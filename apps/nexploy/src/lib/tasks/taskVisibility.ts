import type { Task, TasksEvent } from '@workspace/typescript-interface/task';
import type { Session } from '@/lib/auth/auth';
import { getCallerOrgRole, resolveActiveOrganizationId } from '@/lib/auth/resolveOrgContext';
import { canReadTask, type TaskViewer } from '@/lib/tasks/taskPermissions';

export async function resolveTaskViewer(session: Session): Promise<TaskViewer> {
    const role = session.user.role ?? '';

    if (role === 'admin') return { role, orgRole: null, organizationId: null };

    const organizationId = await resolveActiveOrganizationId(session);
    const orgRole = organizationId ? await getCallerOrgRole(session.user.id, organizationId) : null;

    return { role, orgRole, organizationId };
}

export function filterTasksEvent(viewer: TaskViewer, event: TasksEvent): TasksEvent | null {
    if (event.tasks) {
        return { ...event, tasks: event.tasks.filter((task: Task) => canReadTask(viewer, task)) };
    }

    if (event.task) {
        return canReadTask(viewer, event.task) ? event : null;
    }

    return event;
}
