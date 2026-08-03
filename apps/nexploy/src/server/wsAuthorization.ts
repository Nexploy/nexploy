import type { IncomingMessage } from 'http';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { hasOrgPermission } from '@/lib/auth/orgPermissions';
import { getCallerOrgRoleForProxy, resolveOrganizationIdForContainerId } from '@/lib/auth/resolveContainerOrgForProxy';
import { extractContainerId } from '@/server/wsRoutes';
import type { Actor } from '@nexploy/shared/actor';

const EXEC_USER_PATTERN = /^[a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)?$/;

export interface UpgradeDenial {
    status: number;
    reason: string;
}

export type UpgradeAuthorization = { authorized: false; denial: UpgradeDenial } | { authorized: true; actor: Actor };

export async function authorizeContainerUpgrade(req: IncomingMessage, parsedUrl: URL): Promise<UpgradeAuthorization> {
    const headers = new Headers();
    if (req.headers.cookie) headers.set('cookie', req.headers.cookie);

    const session = await auth.api.getSession({ headers }).catch(() => null);
    const role = session?.user?.role ?? '';

    if (!session?.user || !hasPermission(role, 'container', 'manage')) {
        return { authorized: false, denial: { status: 401, reason: 'Unauthorized' } };
    }

    let organizationId: string | null = session.session?.activeOrganizationId ?? null;

    if (role !== 'admin') {
        const containerId = extractContainerId(parsedUrl.pathname);
        organizationId = containerId ? await resolveOrganizationIdForContainerId(containerId) : null;
        const orgRole = organizationId ? await getCallerOrgRoleForProxy(session.user.id, organizationId) : null;

        if (!orgRole || !hasOrgPermission(orgRole, 'container', 'manage')) {
            return { authorized: false, denial: { status: 403, reason: 'Forbidden' } };
        }
    }

    const userParam = parsedUrl.searchParams.get('user');
    if (userParam && !EXEC_USER_PATTERN.test(userParam)) {
        return { authorized: false, denial: { status: 400, reason: 'Bad Request' } };
    }

    return {
        authorized: true,
        actor: {
            source: 'user',
            userId: session.user.id,
            email: session.user.email ?? null,
            role,
            organizationId,
        },
    };
}
