import { notFound } from 'next/navigation';
import { getUserSession } from '@/services/auth/auth.service';
import { hasOrgPermission } from '@/lib/auth/orgPermissions';
import { getCallerOrgRole, resolveOrganizationIdForRepository } from '@/lib/auth/resolveOrgContext';

export async function requireRepositoryAccess(repositoryId: string): Promise<void> {
    const session = await getUserSession();
    if (!session) notFound();

    if (session.user.role === 'admin') return;

    const organizationId = await resolveOrganizationIdForRepository(repositoryId);
    if (!organizationId) notFound();

    const orgRole = await getCallerOrgRole(session.user.id, organizationId);
    if (!orgRole || !hasOrgPermission(orgRole, 'repository', 'read')) notFound();
}
