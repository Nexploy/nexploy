import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import { Role } from '@workspace/schemas-zod/auth/permissions';

const statement = {
    ...defaultStatements,
    project: ['create', 'share', 'update', 'delete'],
} as const;

const ac = createAccessControl(statement);

const user = ac.newRole({
    project: ['create', 'update'],
});

const admin = ac.newRole({
    project: ['create', 'update'],
    ...adminAc.statements,
});

export const roles: Record<Role, any> = {
    user,
    admin,
} as const;

export const permission = {
    defaultRole: 'user',
    adminRoles: ['admin'],
    ac,
    roles: {
        ...roles,
    },
};
