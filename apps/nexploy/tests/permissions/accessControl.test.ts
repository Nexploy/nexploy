import { describe, expect, it } from 'vitest';
import { hasPermission, PERMISSION_STATEMENT, type PermissionResource } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { canOnOwnedResource } from '@/lib/auth/canOnOwnedResource';
import { ORG_SCOPED_RESOURCES } from '@/lib/auth/orgScopedResources';
import { GLOBAL_ROLES, ORG_ROLES } from '../setup/session';

describe('hasPermission', () => {
    it('grants admin every declared permission', () => {
        const missing = Object.entries(PERMISSION_STATEMENT).flatMap(([resource, actions]) =>
            (actions as readonly string[])
                .filter((action) => !hasPermission('admin', resource as PermissionResource, action))
                .map((action) => `${resource}.${action}`),
        );

        expect(missing).toEqual([]);
    });

    it('denies unknown roles everything', () => {
        for (const [resource, actions] of Object.entries(PERMISSION_STATEMENT)) {
            for (const action of actions as readonly string[]) {
                expect(hasPermission('nonexistent-role', resource as PermissionResource, action)).toBe(false);
            }
        }
    });

    it('denies an empty role name', () => {
        expect(hasPermission('', 'repository', 'read')).toBe(false);
    });

    it('denies an action the resource does not declare', () => {
        for (const role of GLOBAL_ROLES) {
            expect(hasPermission(role, 'repository', 'explode')).toBe(false);
        }
    });

    it('gives guest read access without any write access on repositories', () => {
        expect(hasPermission('guest', 'repository', 'read')).toBe(true);
        expect(hasPermission('guest', 'repository', 'create')).toBe(false);
        expect(hasPermission('guest', 'repository', 'update')).toBe(false);
        expect(hasPermission('guest', 'repository', 'delete')).toBe(false);
    });

    it('keeps host-level infrastructure out of the developer role', () => {
        expect(hasPermission('developer', 'network', 'manage')).toBe(false);
        expect(hasPermission('developer', 'volume', 'remove')).toBe(false);
        expect(hasPermission('developer', 'swarm', 'manage')).toBe(false);
        expect(hasPermission('developer', 'image', 'remove')).toBe(false);
        expect(hasPermission('developer', 'environment', 'create')).toBe(false);
        expect(hasPermission('developer', 'setting', 'manage')).toBe(false);
        expect(hasPermission('developer', 'activity', 'read')).toBe(false);
        expect(hasPermission('developer', 'backup', 'create')).toBe(false);
        expect(hasPermission('developer', 'gitProvider', 'create')).toBe(false);
    });

    it('keeps user administration out of every role but admin', () => {
        for (const role of GLOBAL_ROLES.filter((candidate) => candidate !== 'admin')) {
            expect(hasPermission(role, 'user', 'create')).toBe(false);
            expect(hasPermission(role, 'user', 'delete')).toBe(false);
            expect(hasPermission(role, 'user', 'set-role')).toBe(false);
            expect(hasPermission(role, 'session', 'revoke')).toBe(false);
        }
    });
});

describe('hasOrgPermission', () => {
    it('grants the owner every org-scoped permission the member role has', () => {
        for (const resource of ORG_SCOPED_RESOURCES) {
            if (resource === 'deployment') continue;

            for (const action of PERMISSION_STATEMENT[resource] as readonly string[]) {
                if (!hasOrgPermission('member', resource as OrgPermissionResource, action)) continue;
                expect(hasOrgPermission('owner', resource as OrgPermissionResource, action)).toBe(true);
            }
        }
    });

    it('keeps the member role read-only apart from running builds and managing containers', () => {
        const writes: string[] = [];

        for (const resource of ORG_SCOPED_RESOURCES) {
            for (const action of PERMISSION_STATEMENT[resource] as readonly string[]) {
                if (action === 'read') continue;
                if (!hasOrgPermission('member', resource as OrgPermissionResource, action)) continue;

                writes.push(`${resource}.${action}`);
            }
        }

        expect(writes.sort()).toEqual(['build.run', 'container.manage']);
    });

    it('denies unknown organization roles', () => {
        expect(hasOrgPermission('viewer', 'repository', 'read')).toBe(false);
        expect(hasOrgPermission('', 'repository', 'read')).toBe(false);
    });

    it('gives org admin the same reach as org owner on org-scoped resources', () => {
        for (const resource of ORG_SCOPED_RESOURCES) {
            for (const action of PERMISSION_STATEMENT[resource] as readonly string[]) {
                expect(
                    hasOrgPermission('admin', resource as OrgPermissionResource, action),
                    `${resource}.${action}`,
                ).toBe(hasOrgPermission('owner', resource as OrgPermissionResource, action));
            }
        }
    });
});

describe('canOnOwnedResource', () => {
    const developerInOrgA = { role: 'developer', orgRole: 'member', organizationId: 'org-a' };

    it('falls back to global permissions for host-owned resources', () => {
        expect(canOnOwnedResource(developerInOrgA, 'repository', 'delete', null)).toBe(true);
        expect(canOnOwnedResource({ ...developerInOrgA, role: 'guest' }, 'repository', 'delete', null)).toBe(false);
    });

    it('falls back to global permissions for resources that are not org-scoped', () => {
        expect(canOnOwnedResource(developerInOrgA, 'network', 'manage', 'org-a')).toBe(false);
        expect(canOnOwnedResource({ ...developerInOrgA, role: 'admin' }, 'network', 'manage', 'org-a')).toBe(true);
    });

    it('lets a global admin through regardless of organization', () => {
        const admin = { role: 'admin', orgRole: null, organizationId: null };

        expect(canOnOwnedResource(admin, 'repository', 'delete', 'org-b')).toBe(true);
        expect(canOnOwnedResource(admin, 'envVar', 'write', 'org-b')).toBe(true);
    });

    it('denies a member of another organization', () => {
        expect(canOnOwnedResource(developerInOrgA, 'repository', 'read', 'org-b')).toBe(false);
        expect(canOnOwnedResource(developerInOrgA, 'build', 'run', 'org-b')).toBe(false);
    });

    it('denies a caller with no membership in the owning organization', () => {
        const outsider = { role: 'developer', orgRole: null, organizationId: 'org-a' };

        expect(canOnOwnedResource(outsider, 'repository', 'read', 'org-a')).toBe(false);
    });

    it('applies the organization role, not the global role, inside the owning organization', () => {
        const member = { role: 'developer', orgRole: 'member', organizationId: 'org-a' };

        expect(canOnOwnedResource(member, 'repository', 'read', 'org-a')).toBe(true);
        expect(canOnOwnedResource(member, 'repository', 'delete', 'org-a')).toBe(false);
        expect(canOnOwnedResource(member, 'envVar', 'write', 'org-a')).toBe(false);
        expect(canOnOwnedResource(member, 'build', 'run', 'org-a')).toBe(true);
        expect(canOnOwnedResource(member, 'build', 'delete', 'org-a')).toBe(false);
    });

    it('does not let a guest borrow an organization role to write', () => {
        const guestOwner = { role: 'guest', orgRole: 'owner', organizationId: 'org-a' };

        expect(canOnOwnedResource(guestOwner, 'repository', 'read', 'org-a')).toBe(true);
        expect(canOnOwnedResource(guestOwner, 'repository', 'delete', 'org-a')).toBe(true);
    });

    it('resolves every org role consistently for repository deletion', () => {
        const verdicts = ORG_ROLES.map((orgRole) => [
            orgRole,
            canOnOwnedResource(
                { role: 'developer', orgRole, organizationId: 'org-a' },
                'repository',
                'delete',
                'org-a',
            ),
        ]);

        expect(Object.fromEntries(verdicts)).toEqual({ owner: true, admin: true, member: false });
    });
});
