import type { IncomingMessage } from 'http';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { hasOrgPermission } from '@/lib/auth/orgPermissions';
import {
    getCallerOrgRoleForProxy,
    resolveOrganizationIdForContainerId,
} from '@/lib/auth/resolveContainerOrgForProxy';
import { extractContainerId } from '@/server/wsRoutes';

const EXEC_USER_PATTERN = /^[a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)?$/;

export interface UpgradeDenial {
    status: number;
    reason: string;
}

export async function authorizeContainerUpgrade(
    req: IncomingMessage,
    parsedUrl: URL,
): Promise<UpgradeDenial | null> {
    const headers = new Headers();
    if (req.headers.cookie) headers.set('cookie', req.headers.cookie);

    const session = await auth.api.getSession({ headers }).catch(() => null);
    const role = session?.user?.role ?? '';

    if (!session?.user || !hasPermission(role, 'container', 'manage')) {
        return { status: 401, reason: 'Unauthorized' };
    }

    if (role !== 'admin') {
        const containerId = extractContainerId(parsedUrl.pathname);
        const organizationId = containerId
            ? await resolveOrganizationIdForContainerId(containerId)
            : null;
        const orgRole = organizationId
            ? await getCallerOrgRoleForProxy(session.user.id, organizationId)
            : null;

        if (!orgRole || !hasOrgPermission(orgRole, 'container', 'manage')) {
            return { status: 403, reason: 'Forbidden' };
        }
    }

    const userParam = parsedUrl.searchParams.get('user');
    if (userParam && !EXEC_USER_PATTERN.test(userParam)) {
        return { status: 400, reason: 'Bad Request' };
    }

    return null;
}
