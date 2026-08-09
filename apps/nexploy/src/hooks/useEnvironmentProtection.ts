'use client';

import { useCallback } from 'react';
import type { Environment } from 'generated/client';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { usePermissions } from '@/contexts/PermissionContext';
import type { EnvironmentProtectedAction } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';

type ProtectionFields = Pick<Environment, 'isProtected' | 'allowAdminBypass' | 'protectedActions'>;

function computeBlocked(
    environment: ProtectionFields | undefined,
    action: EnvironmentProtectedAction,
    isAdmin: boolean,
    isExpected: boolean,
): boolean {
    if (!environment) return isExpected;
    if (!environment.isProtected) return false;
    if (!environment.protectedActions.includes(action)) return false;
    return !(isAdmin && environment.allowAdminBypass);
}

export function useEnvironmentProtection() {
    const environments = useEnvironmentStore((state) => state.environments);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);
    const { isAdmin } = usePermissions();

    const current = environments.find((environment) => environment.id === selectedEnvironmentId);

    const isBlocked = useCallback(
        (action: EnvironmentProtectedAction) => computeBlocked(current, action, isAdmin, !!selectedEnvironmentId),
        [current, isAdmin, selectedEnvironmentId],
    );

    const isBlockedOn = useCallback(
        (environmentId: string, action: EnvironmentProtectedAction) =>
            computeBlocked(
                environments.find((environment) => environment.id === environmentId),
                action,
                isAdmin,
                true,
            ),
        [environments, isAdmin],
    );

    return {
        environment: current,
        isProtected: !!current?.isProtected,
        isBlocked,
        isBlockedOn,
    };
}
