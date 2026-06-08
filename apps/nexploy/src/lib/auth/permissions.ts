import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export type Role = 'admin' | 'readWrite' | 'read' | 'system';

export type PermissionActions = {
    repository: 'create' | 'read' | 'update' | 'delete' | 'deploy';
    build: 'read' | 'cancel' | 'delete';
    environment: 'create' | 'read' | 'update' | 'delete';
    docker: 'read' | 'manage' | 'prune';
    gitProvider: 'create' | 'update' | 'delete';
    registry: 'create' | 'read' | 'update' | 'delete';
    user: (typeof adminAc.statements.user)[number];
    session: (typeof adminAc.statements.session)[number];
    backup: 'create' | 'read' | 'restore' | 'delete';
    ai: 'manage';
};

export type PermissionResource = keyof PermissionActions;

const statement = {
    ...defaultStatements,
    user: adminAc.statements.user,
    session: adminAc.statements.session,
    repository: ['create', 'read', 'update', 'delete', 'deploy'] as const,
    build: ['read', 'cancel', 'delete'] as const,
    environment: ['create', 'read', 'update', 'delete'] as const,
    docker: ['read', 'manage', 'prune'] as const,
    gitProvider: ['create', 'update', 'delete'] as const,
    registry: ['create', 'read', 'update', 'delete'] as const,
    backup: ['create', 'read', 'restore', 'delete'] as const,
    ai: ['manage'] as const,
} as const;

const ac = createAccessControl(statement);

const read = ac.newRole({
    repository: ['read'],
    build: ['read'],
    environment: ['read'],
    docker: ['read'],
    registry: ['read'],
});

const readWrite = ac.newRole({
    repository: ['create', 'read', 'update', 'delete', 'deploy'],
    build: ['read', 'cancel', 'delete'],
    environment: ['create', 'read', 'update', 'delete'],
    docker: ['read', 'manage'],
    registry: ['read'],
});

const admin = ac.newRole({
    ...adminAc.statements,
    user: [...adminAc.statements.user],
    repository: ['create', 'read', 'update', 'delete', 'deploy'],
    build: ['read', 'cancel', 'delete'],
    environment: ['create', 'read', 'update', 'delete'],
    docker: ['read', 'manage', 'prune'],
    gitProvider: ['create', 'update', 'delete'],
    registry: ['create', 'read', 'update', 'delete'],
    backup: ['create', 'read', 'restore', 'delete'],
    ai: ['manage'],
});

const system = ac.newRole({
    environment: ['read'],
    repository: ['read'],
    build: ['read'],
    docker: ['read'],
});

export const roles: Record<Role, any> = {
    read,
    readWrite,
    admin,
    system,
} as const;

export const permission = {
    defaultRole: 'readWrite',
    adminRoles: ['admin'],
    ac,
    roles: {
        ...roles,
    },
};

export function hasPermission(role: string, resource: PermissionResource, action: string): boolean {
    return roles[role as Role]?.statements?.[resource]?.includes(action) ?? false;
}
