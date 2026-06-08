'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { PermissionActions, PermissionResource } from '@/lib/auth/permissions';

type CanProps = {
    [R in PermissionResource]: {
        resource: R;
        action: PermissionActions[R];
    };
}[PermissionResource] & {
    children: ReactNode;
    fallback?: ReactNode;
};

export function Can({ children, fallback = null, ...props }: CanProps) {
    const { can } = usePermissions();
    const allowed = can(
        props.resource as PermissionResource,
        props.action as PermissionActions[PermissionResource],
    );
    return allowed ? <>{children}</> : <>{fallback}</>;
}
