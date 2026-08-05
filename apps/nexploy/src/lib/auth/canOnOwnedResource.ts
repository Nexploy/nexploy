import { hasPermission, type PermissionResource } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';

export interface ResourceViewer {
    role: string;
    orgRole: string | null;
    organizationId: string | null;
}

export function canOnOwnedResource(
    viewer: ResourceViewer,
    resource: PermissionResource,
    action: string,
    ownerOrganizationId: string | null,
): boolean {
    if (!ownerOrganizationId || !isOrgScopedResource(resource) || viewer.role === 'admin') {
        return hasPermission(viewer.role, resource, action);
    }

    return (
        ownerOrganizationId === viewer.organizationId &&
        !!viewer.orgRole &&
        hasOrgPermission(viewer.orgRole, resource as OrgPermissionResource, action)
    );
}
