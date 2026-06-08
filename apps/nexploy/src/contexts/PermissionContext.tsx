'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { Role } from '@/lib/auth/permissions';

interface PermissionContextValue {
    role: Role | null;
    isAdmin: boolean;
    hasRole: (role: Role) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
    children: ReactNode;
    role?: string | null;
}

export function PermissionProvider({ children, role }: PermissionProviderProps) {
    const value = useMemo<PermissionContextValue>(
        () => ({
            role: (role as Role) ?? null,
            isAdmin: role === 'admin',
            hasRole: (r: Role) => role === r,
        }),
        [role],
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
