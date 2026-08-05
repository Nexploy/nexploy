'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { hasPermission, PermissionActions, PermissionResource, Role } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionActions, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';
import { NEXPLOY_ORGANIZATION_LABEL } from '@nexploy/shared/ownership';

export type NavPermission = {
    [R in PermissionResource]: { resource: R; action: PermissionActions[R] };
}[PermissionResource];

interface PermissionContextValue {
    role: Role | null;
    orgRole: string | null;
    organizationId: string | null;
    isAdmin: boolean;
    hasRole: (role: Role) => boolean;
    can: <R extends PermissionResource>(resource: R, action: PermissionActions[R]) => boolean;
    canOnContainer: (
        labels: Record<string, string> | null | undefined,
        action: OrgPermissionActions['container'],
    ) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
    children: ReactNode;
    role?: string | null;
    orgRole?: string | null;
    organizationId?: string | null;
}

export function PermissionProvider({ children, role, orgRole, organizationId }: PermissionProviderProps) {
    const value = useMemo<PermissionContextValue>(
        () => ({
            role: (role as Role) ?? null,
            orgRole: orgRole ?? null,
            organizationId: organizationId ?? null,
            isAdmin: role === 'admin',
            hasRole: (r: Role) => role === r,
            can: <R extends PermissionResource>(resource: R, action: PermissionActions[R]) => {
                if (isOrgScopedResource(resource) && role !== 'admin') {
                    return !!orgRole && hasOrgPermission(orgRole, resource as OrgPermissionResource, action as string);
                }
                return hasPermission(role ?? '', resource, action as string);
            },
            canOnContainer: (labels, action) => {
                if (role === 'admin') return true;

                const owner = labels?.[NEXPLOY_ORGANIZATION_LABEL] ?? null;
                if (!owner) return hasPermission(role ?? '', 'container', action);

                return !!orgRole && hasOrgPermission(orgRole, 'container', action);
            },
        }),
        [role, orgRole, organizationId],
    );

    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}
