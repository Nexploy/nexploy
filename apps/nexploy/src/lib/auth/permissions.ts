import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export type Role = 'guest' | 'developer' | 'admin' | 'system';

export type PermissionActions = {
    repository: 'create' | 'read' | 'update' | 'delete';
    build: 'read' | 'run' | 'cancel' | 'delete';
    deployment: 'deploy' | 'rollback';
    pipeline: 'read' | 'update' | 'webhook';
    envVar: 'read' | 'write';
    environment: 'create' | 'read' | 'update' | 'delete';
    stage: 'read' | 'manage';
    domain: 'read' | 'manage';
    ssl: 'read' | 'manage';

    container: 'read' | 'manage' | 'remove';
    image: 'read' | 'pull' | 'manage' | 'remove';
    network: 'read' | 'manage' | 'remove';
    volume: 'read' | 'manage' | 'remove';
    swarm: 'read' | 'manage';

    gitProvider: 'create' | 'read' | 'update' | 'delete';
    registry: 'create' | 'read' | 'update' | 'delete' | 'mirror';
    dns: 'read' | 'manage';
    cloudBackup: 'read' | 'manage';

    backup: 'create' | 'read' | 'restore' | 'delete';
    traefik: 'read' | 'manage';
    setting: 'read' | 'manage';
    ai: 'read' | 'manage';
    mcpKey: 'create' | 'read' | 'delete';
    monitoring: 'read';
    user: (typeof adminAc.statements.user)[number];
    session: (typeof adminAc.statements.session)[number];
};

export type PermissionResource = keyof PermissionActions;

const statement = {
    ...defaultStatements,
    user: adminAc.statements.user,
    session: adminAc.statements.session,
    repository: ['create', 'read', 'update', 'delete'] as const,
    build: ['read', 'run', 'cancel', 'delete'] as const,
    deployment: ['deploy', 'rollback'] as const,
    pipeline: ['read', 'update', 'webhook'] as const,
    envVar: ['read', 'write'] as const,
    environment: ['create', 'read', 'update', 'delete'] as const,
    stage: ['read', 'manage'] as const,
    domain: ['read', 'manage'] as const,
    ssl: ['read', 'manage'] as const,
    container: ['read', 'manage', 'remove'] as const,
    image: ['read', 'pull', 'manage', 'remove'] as const,
    network: ['read', 'manage', 'remove'] as const,
    volume: ['read', 'manage', 'remove'] as const,
    swarm: ['read', 'manage'] as const,
    gitProvider: ['create', 'read', 'update', 'delete'] as const,
    registry: ['create', 'read', 'update', 'delete', 'mirror'] as const,
    dns: ['read', 'manage'] as const,
    cloudBackup: ['read', 'manage'] as const,
    backup: ['create', 'read', 'restore', 'delete'] as const,
    traefik: ['read', 'manage'] as const,
    setting: ['read', 'manage'] as const,
    ai: ['read', 'manage'] as const,
    mcpKey: ['create', 'read', 'delete'] as const,
    monitoring: ['read'] as const,
} as const;

const ac = createAccessControl(statement);

const guest = ac.newRole({
    repository: ['read'],
    build: ['read'],
    pipeline: ['read'],
    environment: ['read'],
    stage: ['read'],
    domain: ['read'],
    container: ['read'],
    image: ['read'],
    network: ['read'],
    volume: ['read'],
    swarm: ['read'],
    monitoring: ['read'],
});

const developer = ac.newRole({
    repository: ['create', 'read', 'update', 'delete'],
    build: ['read', 'run', 'cancel', 'delete'],
    deployment: ['deploy', 'rollback'],
    pipeline: ['read', 'update', 'webhook'],
    envVar: ['read', 'write'],
    environment: ['read', 'update'],
    stage: ['read', 'manage'],
    domain: ['read', 'manage'],
    ssl: ['read', 'manage'],
    container: ['read', 'manage', 'remove'],
    image: ['read', 'pull'],
    network: ['read'],
    volume: ['read'],
    swarm: ['read'],
    gitProvider: ['read'],
    dns: ['read'],
    cloudBackup: ['read'],
    traefik: ['read', 'manage'],
    setting: ['read'],
    ai: ['read'],
    mcpKey: ['read'],
    monitoring: ['read'],
});

const admin = ac.newRole({
    ...adminAc.statements,
    user: [...adminAc.statements.user],
    repository: ['create', 'read', 'update', 'delete'],
    build: ['read', 'run', 'cancel', 'delete'],
    deployment: ['deploy', 'rollback'],
    pipeline: ['read', 'update', 'webhook'],
    envVar: ['read', 'write'],
    environment: ['create', 'read', 'update', 'delete'],
    stage: ['read', 'manage'],
    domain: ['read', 'manage'],
    ssl: ['read', 'manage'],
    container: ['read', 'manage', 'remove'],
    image: ['read', 'pull', 'manage', 'remove'],
    network: ['read', 'manage', 'remove'],
    volume: ['read', 'manage', 'remove'],
    swarm: ['read', 'manage'],
    gitProvider: ['create', 'read', 'update', 'delete'],
    registry: ['create', 'read', 'update', 'delete', 'mirror'],
    dns: ['read', 'manage'],
    cloudBackup: ['read', 'manage'],
    backup: ['create', 'read', 'restore', 'delete'],
    traefik: ['read', 'manage'],
    setting: ['read', 'manage'],
    ai: ['read', 'manage'],
    mcpKey: ['create', 'read', 'delete'],
    monitoring: ['read'],
});

const system = ac.newRole({
    repository: ['read'],
    build: ['read'],
    environment: ['read'],
    container: ['read'],
    image: ['read'],
    network: ['read'],
    volume: ['read'],
    monitoring: ['read'],
});

export const roles: Record<Role, any> = {
    guest,
    developer,
    admin,
    system,
} as const;

export const permission = {
    defaultRole: 'developer',
    adminRoles: ['admin'],
    ac,
    roles: {
        ...roles,
    },
};

export function hasPermission(role: string, resource: PermissionResource, action: string): boolean {
    return roles[role as Role]?.statements?.[resource]?.includes(action) ?? false;
}
