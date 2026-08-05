import { describe, expect, it } from 'vitest';
import { collectEndpoints } from './inventory';
import { GUARD_EXEMPTIONS } from './exemptions';
import { hasPermission, PERMISSION_STATEMENT, type PermissionResource } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { ORG_SCOPED_RESOURCES } from '@/lib/auth/orgScopedResources';
import { GLOBAL_ROLES, ORG_ROLES } from '../setup/session';

const endpoints = collectEndpoints();

function verdict(role: string, endpoint: (typeof endpoints)[number]): string {
    if (endpoint.guards.length === 0) {
        return `exempt:${GUARD_EXEMPTIONS[endpoint.id]?.category ?? 'undeclared'}`;
    }

    return endpoint.guards.every((guard) => hasPermission(role, guard.resource as PermissionResource, guard.action))
        ? 'allow'
        : 'deny';
}

describe('permission matrix', () => {
    it('resolves the same verdict for every endpoint and global role', () => {
        const matrix = endpoints.map((endpoint) => ({
            endpoint: endpoint.id,
            guards: endpoint.guards.map((guard) => `${guard.resource}.${guard.action}`).join(' + ') || null,
            ...Object.fromEntries(GLOBAL_ROLES.map((role) => [role, verdict(role, endpoint)])),
        }));

        expect(matrix).toMatchSnapshot();
    });

    it('resolves the same verdict for every org-scoped guard and organization role', () => {
        const orgScopedGuards = new Set<string>();

        for (const endpoint of endpoints) {
            for (const guard of endpoint.guards) {
                if ((ORG_SCOPED_RESOURCES as readonly string[]).includes(guard.resource)) {
                    orgScopedGuards.add(`${guard.resource}.${guard.action}`);
                }
            }
        }

        const matrix = [...orgScopedGuards].sort().map((key) => {
            const [resource = '', action = ''] = key.split('.');

            return {
                guard: key,
                ...Object.fromEntries(
                    ORG_ROLES.map((role) => [
                        role,
                        hasOrgPermission(role, resource as OrgPermissionResource, action) ? 'allow' : 'deny',
                    ]),
                ),
            };
        });

        expect(matrix).toMatchSnapshot();
    });

    it('records the full role capability table', () => {
        const table = Object.entries(PERMISSION_STATEMENT).flatMap(([resource, actions]) =>
            (actions as readonly string[]).map((action) => ({
                permission: `${resource}.${action}`,
                ...Object.fromEntries(
                    GLOBAL_ROLES.map((role) => [role, hasPermission(role, resource as PermissionResource, action)]),
                ),
            })),
        );

        expect(table).toMatchSnapshot();
    });

    it('never lets guest reach a mutating permission', () => {
        const mutating = new Set([
            'create',
            'update',
            'delete',
            'manage',
            'remove',
            'run',
            'cancel',
            'deploy',
            'rollback',
            'write',
            'restore',
            'pull',
            'mirror',
            'webhook',
        ]);

        const leaks = Object.entries(PERMISSION_STATEMENT).flatMap(([resource, actions]) =>
            (actions as readonly string[])
                .filter((action) => mutating.has(action))
                .filter((action) => hasPermission('guest', resource as PermissionResource, action))
                .map((action) => `${resource}.${action}`),
        );

        expect(leaks).toEqual([]);
    });

    it('never lets the system role reach anything beyond reads', () => {
        const leaks = Object.entries(PERMISSION_STATEMENT).flatMap(([resource, actions]) =>
            (actions as readonly string[])
                .filter((action) => action !== 'read')
                .filter((action) => hasPermission('system', resource as PermissionResource, action))
                .map((action) => `${resource}.${action}`),
        );

        expect(leaks).toEqual([]);
    });
});
