import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_ROOT } from '../setup/env';
import { collectEndpoints } from './inventory';
import { GUARD_EXEMPTIONS } from './exemptions';

const RUNTIME_DIR = join(APP_ROOT, 'tests/runtime');

const UNTESTED: Record<string, string> = {
    'GET src/app/api/[...all]/route.ts': 'Better Auth catch-all, covered through the real sign-in used by every test',
    'POST src/app/api/[...all]/route.ts': 'Better Auth catch-all, covered through the real sign-in used by every test',
    'GET src/app/api/inngest/route.ts': 'Inngest serve handler, owned by the Inngest SDK',
    'POST src/app/api/inngest/route.ts': 'Inngest serve handler, owned by the Inngest SDK',
    'PUT src/app/api/inngest/route.ts': 'Inngest serve handler, owned by the Inngest SDK',
    'GET src/app/api/mcp/route.ts': 'Better Auth MCP handler, owned by the plugin',
    'POST src/app/api/mcp/route.ts': 'Better Auth MCP handler, owned by the plugin',
    'DELETE src/app/api/mcp/route.ts': 'Better Auth MCP handler, owned by the plugin',
    'GET src/app/api/git/oauth/connect/route.ts': 'Starts a real OAuth redirect to the git provider',
    'GET src/app/api/git/oauth/callback/route.ts': 'Completes a real OAuth exchange with the git provider',
    'src/actions/auth/twoFactorAuthEnable.action.ts#onTwoFactorAuthEnableAction':
        'Needs a TOTP enrolment flow that the harness does not drive yet',
    'src/actions/auth/twoFactorAuthDisable.action.ts#onTwoFactorAuthDisableAction':
        'Needs a TOTP enrolment flow that the harness does not drive yet',
    'src/actions/auth/twoFactorAuthVerifCode.action.ts#twoFactorAuthVerifCodeAction':
        'Needs a TOTP enrolment flow that the harness does not drive yet',
    'src/actions/auth/twoFactorAuthUseBackupCode.action.ts#twoFactorAuthUseBackupCodeAction':
        'Needs a TOTP enrolment flow that the harness does not drive yet',
};

function runtimeSources(): string {
    return readdirSync(RUNTIME_DIR)
        .filter((entry) => entry.endsWith('.ts'))
        .map((entry) => readFileSync(join(RUNTIME_DIR, entry), 'utf8'))
        .join('\n');
}

const sources = runtimeSources();
const endpoints = collectEndpoints();

function isReferenced(endpoint: (typeof endpoints)[number]): boolean {
    if (endpoint.kind === 'action') {
        return new RegExp(`\\b${endpoint.exportName}\\b`).test(sources);
    }

    const importPath = endpoint.file.replace(/^src/, '@').replace(/\.ts$/, '');
    return sources.includes(importPath);
}

describe('runtime coverage', () => {
    it('exercises every endpoint that declares a permission guard', () => {
        const missing = endpoints
            .filter((endpoint) => endpoint.guards.length > 0)
            .filter((endpoint) => !isReferenced(endpoint))
            .filter((endpoint) => !UNTESTED[endpoint.id])
            .map((endpoint) => endpoint.id);

        expect(missing, 'add a case in tests/runtime, or declare the endpoint in UNTESTED with a reason').toEqual([]);
    });

    it('exercises every endpoint that relies on an exemption instead of a guard', () => {
        const missing = Object.keys(GUARD_EXEMPTIONS)
            .filter((id) => !UNTESTED[id])
            .filter((id) => {
                const endpoint = endpoints.find((candidate) => candidate.id === id);
                return endpoint && !isReferenced(endpoint);
            });

        expect(missing, 'add a case in tests/runtime, or declare the endpoint in UNTESTED with a reason').toEqual([]);
    });

    it('keeps the untested list free of endpoints that no longer exist', () => {
        const known = new Set(endpoints.map((endpoint) => endpoint.id));
        const stale = Object.keys(UNTESTED).filter((id) => !known.has(id));

        expect(stale).toEqual([]);
    });

    it('keeps the untested list free of endpoints that are now covered', () => {
        const covered = Object.keys(UNTESTED).filter((id) => {
            const endpoint = endpoints.find((candidate) => candidate.id === id);
            return endpoint && isReferenced(endpoint);
        });

        expect(covered, 'these endpoints are tested now, drop them from UNTESTED').toEqual([]);
    });
});
