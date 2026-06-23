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
    condition?: boolean;
};

export function Can({ children, fallback = null, condition = true, ...props }: CanProps) {
    const { can } = usePermissions();
    const allowed =
        condition &&
        can(
            props.resource as PermissionResource,
            props.action as PermissionActions[PermissionResource],
        );
    return allowed ? <>{children}</> : <>{fallback}</>;
}
