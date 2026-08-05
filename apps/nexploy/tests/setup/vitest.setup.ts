import './env';
import { beforeEach, vi } from 'vitest';
import { logout } from './session';
import { getTestHeaders, resetNextMocks, testCookies, TestRedirectError, translator } from './nextMocks';
import { kyDockerMock, resetDockerMock } from './dockerMock';

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

vi.mock('@/lib/api/kyDocker', () => ({
    kyDocker: kyDockerMock,
}));

beforeEach(() => {
    logout();
    resetNextMocks();
    resetDockerMock();
});
