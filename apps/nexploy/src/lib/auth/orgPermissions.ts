import { createAccessControl } from 'better-auth/plugins/access';

export type OrgRole = 'owner' | 'admin' | 'member';

export type OrgPermissionActions = {
    repository: 'create' | 'read' | 'update' | 'delete';
    build: 'read' | 'run' | 'cancel' | 'delete';
    deployment: 'deploy' | 'rollback';
    pipeline: 'read' | 'update' | 'webhook';
    envVar: 'read' | 'write';
    stage: 'read' | 'manage';
    domain: 'read' | 'manage';
    ssl: 'read' | 'manage';
    container: 'read' | 'manage' | 'remove';
};

export type OrgPermissionResource = keyof OrgPermissionActions;

const statement = {
    repository: ['create', 'read', 'update', 'delete'],
    build: ['read', 'run', 'cancel', 'delete'],
    deployment: ['deploy', 'rollback'],
    pipeline: ['read', 'update', 'webhook'],
    envVar: ['read', 'write'],
    stage: ['read', 'manage'],
    domain: ['read', 'manage'],
    ssl: ['read', 'manage'],
    container: ['read', 'manage', 'remove'],
} as const;

export const orgAc = createAccessControl(statement);

export const orgMember = orgAc.newRole({
    repository: ['read'],
    build: ['read', 'run'],
    pipeline: ['read'],
    envVar: ['read'],
    stage: ['read'],
    domain: ['read'],
    ssl: ['read'],
    container: ['read', 'manage'],
});

export const orgAdmin = orgAc.newRole({
    repository: ['create', 'read', 'update', 'delete'],
    build: ['read', 'run', 'cancel', 'delete'],
    deployment: ['deploy', 'rollback'],
    pipeline: ['read', 'update', 'webhook'],
    envVar: ['read', 'write'],
    stage: ['read', 'manage'],
    domain: ['read', 'manage'],
    ssl: ['read', 'manage'],
    container: ['read', 'manage', 'remove'],
});

export const orgOwner = orgAc.newRole({
    ...orgAdmin.statements,
});

export const orgRoles: Record<OrgRole, any> = {
    owner: orgOwner,
    admin: orgAdmin,
    member: orgMember,
};

export function hasOrgPermission(role: string, resource: OrgPermissionResource, action: string): boolean {
    return orgRoles[role as OrgRole]?.statements?.[resource]?.includes(action) ?? false;
}
