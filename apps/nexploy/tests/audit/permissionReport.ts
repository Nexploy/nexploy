import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_ROOT } from '../setup/env';
import { collectEndpoints, type Endpoint } from './inventory';
import { GUARD_EXEMPTIONS } from './exemptions';
import { hasPermission, PERMISSION_STATEMENT, type PermissionResource } from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { ORG_SCOPED_RESOURCES } from '@/lib/auth/orgScopedResources';

const DELEGATED_RESOURCES = new Set(['user', 'session']);

const GLOBAL_ROLES = ['guest', 'developer', 'admin', 'system'] as const;
const ORG_ROLES = ['owner', 'admin', 'member'] as const;

const endpoints = collectEndpoints();

interface PermissionUsage {
    resource: string;
    action: string;
    key: string;
    orgScoped: boolean;
    endpoints: Endpoint[];
}

function collectUsage(): PermissionUsage[] {
    const usage = new Map<string, PermissionUsage>();

    for (const [resource, actions] of Object.entries(PERMISSION_STATEMENT)) {
        for (const action of actions as readonly string[]) {
            const key = `${resource}.${action}`;
            usage.set(key, {
                resource,
                action,
                key,
                orgScoped: (ORG_SCOPED_RESOURCES as readonly string[]).includes(resource),
                endpoints: [],
            });
        }
    }

    for (const endpoint of endpoints) {
        for (const guard of endpoint.guards) {
            usage.get(`${guard.resource}.${guard.action}`)?.endpoints.push(endpoint);
        }
    }

    return [...usage.values()];
}

function mark(allowed: boolean): string {
    return allowed ? 'yes' : '—';
}

function endpointLabel(endpoint: Endpoint): string {
    return endpoint.kind === 'route' ? `\`${endpoint.id}\`` : `\`${endpoint.exportName}\``;
}

function resolverOf(endpoint: Endpoint, key: string): string {
    const guard = endpoint.guards.find((candidate) => `${candidate.resource}.${candidate.action}` === key);
    return guard?.orgResolver ?? '';
}

export function buildReport(): string {
    const usage = collectUsage();
    const guarded = endpoints.filter((endpoint) => endpoint.guards.length > 0);
    const unguarded = endpoints.filter((endpoint) => endpoint.guards.length === 0);
    const unused = usage.filter((entry) => entry.endpoints.length === 0);

    const lines: string[] = [];

    lines.push('# Permission report');
    lines.push('');
    lines.push('Generated from `src/lib/auth/permissions.ts` and the endpoint inventory.');
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push('| Measure | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Endpoints discovered | ${endpoints.length} |`);
    lines.push(`| Endpoints with a \`requirePermission\` guard | ${guarded.length} |`);
    lines.push(`| Endpoints without a guard (declared exemptions) | ${unguarded.length} |`);
    lines.push(`| Declared permissions | ${usage.length} |`);
    lines.push(`| Permissions required by at least one endpoint | ${usage.length - unused.length} |`);
    lines.push(`| Permissions never required | ${unused.length} |`);
    lines.push('');

    const unusedApp = unused.filter((entry) => !DELEGATED_RESOURCES.has(entry.resource));
    const unusedDelegated = unused.filter((entry) => DELEGATED_RESOURCES.has(entry.resource));

    lines.push('## Declared permissions that no endpoint requires');
    lines.push('');

    if (unusedApp.length === 0) {
        lines.push('None.');
    } else {
        lines.push('No application endpoint requires these permissions. Either the feature does not exist yet,');
        lines.push('or the endpoint that should carry the permission is guarded by a different one.');
        lines.push('');
        lines.push('| Permission | Roles that hold it |');
        lines.push('| --- | --- |');

        for (const entry of unusedApp) {
            const holders = GLOBAL_ROLES.filter((role) =>
                hasPermission(role, entry.resource as PermissionResource, entry.action),
            );
            lines.push(`| \`${entry.key}\` | ${holders.length > 0 ? holders.join(', ') : 'none'} |`);
        }
    }

    lines.push('');
    lines.push('### Delegated to Better Auth');
    lines.push('');
    lines.push('No Nexploy endpoint requires these permissions: the Better Auth admin plugin enforces them');
    lines.push('itself behind `/api/[...all]`.');
    lines.push('');
    lines.push(`Permissions concerned: ${unusedDelegated.map((entry) => `\`${entry.key}\``).join(', ')}.`);

    lines.push('');
    lines.push('## Permission to endpoint mapping');
    lines.push('');
    lines.push('For each permission: the global roles that hold it, and the endpoints that require it.');
    lines.push('Resources tagged "org" are decided by the organization role when the resource belongs to an');
    lines.push('organization, and by the global role when it belongs to the host.');
    lines.push('');

    const byResource = new Map<string, PermissionUsage[]>();
    for (const entry of usage) {
        byResource.set(entry.resource, [...(byResource.get(entry.resource) ?? []), entry]);
    }

    for (const [resource, entries] of byResource) {
        const orgScoped = entries[0]?.orgScoped ?? false;
        lines.push(`### \`${resource}\`${orgScoped ? ' — org' : ''}`);
        lines.push('');
        lines.push(
            `| Action | ${GLOBAL_ROLES.join(' | ')}${orgScoped ? ` | ${ORG_ROLES.map((r) => `org:${r}`).join(' | ')}` : ''} | Endpoints |`,
        );
        lines.push(`| --- |${' --- |'.repeat(GLOBAL_ROLES.length + (orgScoped ? ORG_ROLES.length : 0) + 1)}`);

        for (const entry of entries) {
            const globals = GLOBAL_ROLES.map((role) =>
                mark(hasPermission(role, entry.resource as PermissionResource, entry.action)),
            );

            const orgs = orgScoped
                ? ORG_ROLES.map((role) =>
                      mark(hasOrgPermission(role, entry.resource as OrgPermissionResource, entry.action)),
                  )
                : [];

            const used =
                entry.endpoints.length === 0
                    ? '**none**'
                    : entry.endpoints
                          .map((endpoint) => {
                              const resolver = resolverOf(endpoint, entry.key);
                              return `${endpointLabel(endpoint)}${resolver ? ` _(${resolver})_` : ''}`;
                          })
                          .join('<br>');

            lines.push(`| \`${entry.action}\` | ${[...globals, ...orgs].join(' | ')} | ${used} |`);
        }

        lines.push('');
    }

    lines.push('## Endpoints without a guard');
    lines.push('');
    lines.push('| Endpoint | Category | Reason |');
    lines.push('| --- | --- | --- |');

    for (const endpoint of unguarded) {
        const exemption = GUARD_EXEMPTIONS[endpoint.id];
        lines.push(
            `| \`${endpoint.id}\` | ${exemption?.category ?? '**undeclared**'} | ${exemption?.reason ?? '**needs a justification**'} |`,
        );
    }

    lines.push('');
    lines.push('## Worth tightening');
    lines.push('');

    const reviews = Object.entries(GUARD_EXEMPTIONS).filter(([, exemption]) => exemption.review);

    if (reviews.length === 0) {
        lines.push('Nothing.');
    } else {
        lines.push('| Endpoint | Note |');
        lines.push('| --- | --- |');
        for (const [id, exemption] of reviews) {
            lines.push(`| \`${id}\` | ${exemption.review} |`);
        }
    }

    lines.push('');

    return lines.join('\n');
}

const report = buildReport();
const outputPath = process.argv[2] ?? join(APP_ROOT, 'tests/PERMISSIONS.md');

writeFileSync(outputPath, report);
console.log(`Report written to ${outputPath}`);
