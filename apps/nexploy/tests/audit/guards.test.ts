import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_ROOT } from '../setup/env';
import { collectActionEndpoints, collectEndpoints, collectRouteEndpoints, type Endpoint } from './inventory';
import { GUARD_EXEMPTIONS, REVIEW_FLAGS } from './exemptions';
import { ORG_SCOPED_RESOURCES } from '@/lib/auth/orgScopedResources';
import { PERMISSION_STATEMENT } from '@/lib/auth/permissions';

const endpoints = collectEndpoints();
const guarded = endpoints.filter((endpoint) => endpoint.guards.length > 0);
const unguarded = endpoints.filter((endpoint) => endpoint.guards.length === 0);

function sourceOf(endpoint: Endpoint): string {
    return readFileSync(join(APP_ROOT, endpoint.file), 'utf8');
}

describe('endpoint inventory', () => {
    it('discovers every server action and API route', () => {
        expect(collectActionEndpoints().length).toBeGreaterThan(100);
        expect(collectRouteEndpoints().length).toBeGreaterThan(50);
    });

    it('gives every endpoint a unique identifier', () => {
        const ids = endpoints.map((endpoint) => endpoint.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('permission guards', () => {
    it('leaves no endpoint without either a permission guard or a declared exemption', () => {
        const undeclared = unguarded.filter((endpoint) => !GUARD_EXEMPTIONS[endpoint.id]).map((e) => e.id);

        expect(
            undeclared,
            'add a requirePermission guard, or declare the endpoint in tests/audit/exemptions.ts',
        ).toEqual([]);
    });

    it('keeps the exemption list free of entries that no longer exist', () => {
        const known = new Set(endpoints.map((endpoint) => endpoint.id));
        const stale = Object.keys(GUARD_EXEMPTIONS).filter((id) => !known.has(id));

        expect(stale, 'remove these entries from tests/audit/exemptions.ts').toEqual([]);
    });

    it('keeps the exemption list free of endpoints that are now guarded', () => {
        const redundant = guarded.filter((endpoint) => GUARD_EXEMPTIONS[endpoint.id]).map((e) => e.id);

        expect(redundant, 'these endpoints now declare a guard, drop their exemption').toEqual([]);
    });

    it('requires an authentication middleware on every guarded endpoint', () => {
        const unauthenticated = guarded
            .filter((endpoint) => endpoint.authMiddleware === null)
            .map((endpoint) => endpoint.id);

        expect(unauthenticated).toEqual([]);
    });

    it('only guards resources and actions that the access control declares', () => {
        const unknown: string[] = [];

        for (const endpoint of guarded) {
            for (const guard of endpoint.guards) {
                const actions = PERMISSION_STATEMENT[guard.resource as keyof typeof PERMISSION_STATEMENT] as
                    | readonly string[]
                    | undefined;

                if (!actions) unknown.push(`${endpoint.id} — unknown resource "${guard.resource}"`);
                else if (!actions.includes(guard.action))
                    unknown.push(`${endpoint.id} — unknown action "${guard.resource}.${guard.action}"`);
            }
        }

        expect(unknown).toEqual([]);
    });

    it('gives every org-scoped guard an organization resolver', () => {
        const missing: string[] = [];

        for (const endpoint of guarded) {
            for (const guard of endpoint.guards) {
                if (!(ORG_SCOPED_RESOURCES as readonly string[]).includes(guard.resource)) continue;
                if (guard.orgResolver) continue;

                missing.push(`${endpoint.id} — ${guard.resource}.${guard.action}`);
            }
        }

        expect(
            missing,
            'org-scoped resources need a resolver (or the explicit HOST_SCOPED marker), otherwise every non-admin is denied',
        ).toEqual([]);
    });

    it('never puts an organization resolver on a resource that is not org-scoped', () => {
        const misplaced: string[] = [];

        for (const endpoint of guarded) {
            for (const guard of endpoint.guards) {
                if (!guard.orgResolver) continue;
                if ((ORG_SCOPED_RESOURCES as readonly string[]).includes(guard.resource)) continue;

                misplaced.push(`${endpoint.id} — ${guard.resource}.${guard.action} (${guard.orgResolver})`);
            }
        }

        expect(misplaced, 'the resolver is ignored for resources outside ORG_SCOPED_RESOURCES').toEqual([]);
    });

    it('names every server action so its activity log entry is identifiable', () => {
        const unnamed = endpoints
            .filter((endpoint) => endpoint.kind === 'action' && !endpoint.metadataName)
            .map((endpoint) => endpoint.id);

        expect(unnamed).toEqual([]);
    });
});

describe('exemption evidence', () => {
    it('keeps an internalApiAuth middleware on every internal-api-key exemption', () => {
        const broken = Object.entries(GUARD_EXEMPTIONS)
            .filter(([, exemption]) => exemption.category === 'internal-api-key')
            .filter(([id]) => {
                const endpoint = endpoints.find((candidate) => candidate.id === id);
                if (!endpoint) return false;
                if (endpoint.authMiddleware === 'internalApiAuth') return false;

                return !/timingSafeEqual/.test(sourceOf(endpoint));
            })
            .map(([id]) => id);

        expect(broken, 'these endpoints claim to be key-authenticated but no longer verify a key').toEqual([]);
    });

    it('keeps an inline organization role check on every org-role-check exemption', () => {
        const broken = Object.entries(GUARD_EXEMPTIONS)
            .filter(([, exemption]) => exemption.category === 'org-role-check')
            .filter(([id]) => {
                const endpoint = endpoints.find((candidate) => candidate.id === id);
                return endpoint && !/getCallerOrgRole/.test(sourceOf(endpoint));
            })
            .map(([id]) => id);

        expect(broken, 'these endpoints claim an inline organization role check that is gone').toEqual([]);
    });

    it('keeps a session behind every self-service and session-scoped exemption', () => {
        const broken = Object.entries(GUARD_EXEMPTIONS)
            .filter(([, exemption]) => ['self-service', 'session-scoped'].includes(exemption.category))
            .filter(([id]) => {
                const endpoint = endpoints.find((candidate) => candidate.id === id);
                if (!endpoint) return false;
                return endpoint.authMiddleware === null;
            })
            .map(([id]) => id);

        expect(broken, 'these endpoints claim a session-scoped guarantee but accept anonymous callers').toEqual([]);
    });

    it('keeps every delegated-auth exemption delegating to Better Auth', () => {
        const broken = Object.entries(GUARD_EXEMPTIONS)
            .filter(([, exemption]) => exemption.category === 'delegated-auth')
            .filter(([id]) => {
                const endpoint = endpoints.find((candidate) => candidate.id === id);
                return endpoint && !/services\/auth\/auth\.service|lib\/auth\/auth/.test(sourceOf(endpoint));
            })
            .map(([id]) => id);

        expect(broken, 'these endpoints no longer delegate authentication to Better Auth').toEqual([]);
    });

    it('reports the exemptions that are worth tightening', () => {
        expect(REVIEW_FLAGS).toMatchSnapshot();
    });
});
