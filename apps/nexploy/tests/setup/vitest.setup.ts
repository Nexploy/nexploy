import './env';
import { beforeEach, vi } from 'vitest';
import { logout } from './session';
import { getTestHeaders, resetNextMocks, testCookies, TestRedirectError, translator } from './nextMocks';
import { kyDockerMock, resetDockerMock } from './dockerMock';
import { inngestMock, resetInngestMock } from './inngestMock';

vi.mock('next/headers', () => ({
    cookies: async () => testCookies,
    headers: async () => getTestHeaders(),
    draftMode: async () => ({ isEnabled: false }),
}));

vi.mock('next/navigation', () => ({
    redirect: (url: string) => {
        throw new TestRedirectError(url);
    },
    permanentRedirect: (url: string) => {
        throw new TestRedirectError(url);
    },
    notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
    },
    unstable_rethrow: (error: unknown) => {
        if (error instanceof TestRedirectError) throw error;
    },
    RedirectType: { push: 'push', replace: 'replace' },
}));

vi.mock('next-intl/server', () => ({
    getTranslations: async (namespace?: string | { namespace?: string }) =>
        translator(typeof namespace === 'string' ? namespace : (namespace?.namespace ?? 'common')),
    getLocale: async () => 'en',
    getMessages: async () => ({}),
    getFormatter: async () => ({}),
    getNow: async () => new Date(),
    getTimeZone: async () => 'UTC',
    setRequestLocale: () => {},
}));

const DEV_DOCKER_API_PORTS = [':3300'];
const dockerApiUrl = process.env.DOCKER_API_URL ?? '';

if (DEV_DOCKER_API_PORTS.some((port) => dockerApiUrl.includes(port))) {
    throw new Error(
        `The tests must never reach the development docker-api (DOCKER_API_URL=${dockerApiUrl}). ` +
            'Point it at the isolated test instance in apps/nexploy/.env.test.',
    );
}

if (process.env.INNGEST_BASE_URL?.includes(':8288')) {
    throw new Error(
        `The tests must never reach the development Inngest server (INNGEST_BASE_URL=${process.env.INNGEST_BASE_URL}). ` +
            'Point it at the isolated test instance in apps/nexploy/.env.test.',
    );
}

const usesRealInngest = process.env.NEXPLOY_TEST_INNGEST === 'real' || process.env.NEXPLOY_TEST_DOCKER === 'real';

vi.mock('@/inngest/client', async (importOriginal) => {
    if (process.env.NEXPLOY_TEST_INNGEST === 'real' || process.env.NEXPLOY_TEST_DOCKER === 'real') {
        return importOriginal<typeof import('@/inngest/client')>();
    }

    return { inngest: inngestMock };
});

const usesRealDockerApi = process.env.NEXPLOY_TEST_DOCKER === 'real';

vi.mock('@/lib/api/kyDocker', async (importOriginal) => {
    if (process.env.NEXPLOY_TEST_DOCKER === 'real') {
        return importOriginal<typeof import('@/lib/api/kyDocker')>();
    }

    return { kyDocker: kyDockerMock };
});

beforeEach(() => {
    logout();
    resetNextMocks();
    if (!usesRealInngest) resetInngestMock();
    if (!usesRealDockerApi) resetDockerMock();
});
