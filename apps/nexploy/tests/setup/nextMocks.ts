export const REDIRECT_MARKER = 'NEXT_REDIRECT';

export class TestRedirectError extends Error {
    readonly digest: string;

    constructor(readonly url: string) {
        super(`${REDIRECT_MARKER};${url}`);
        this.digest = `${REDIRECT_MARKER};push;${url};307;`;
    }
}

export function isTestRedirectError(error: unknown): error is TestRedirectError {
    return error instanceof TestRedirectError;
}

const cookieStore = new Map<string, { name: string; value: string }>();

export const testCookies = {
    get: (name: string) => cookieStore.get(name),
    getAll: () => [...cookieStore.values()],
    set: (name: string, value: string) => {
        cookieStore.set(name, { name, value });
    },
    delete: (name: string) => {
        cookieStore.delete(name);
    },
    has: (name: string) => cookieStore.has(name),
    clear: () => cookieStore.clear(),
};

let requestHeaders = new Headers({
    'user-agent': 'vitest',
    'x-forwarded-for': '127.0.0.1',
    'accept-language': 'en',
});

export function setTestHeaders(init: Record<string, string>) {
    requestHeaders = new Headers({ ...Object.fromEntries(requestHeaders), ...init });
}

export function getTestHeaders() {
    return requestHeaders;
}

export function resetNextMocks() {
    cookieStore.clear();
    requestHeaders = new Headers({
        'user-agent': 'vitest',
        'x-forwarded-for': '127.0.0.1',
        'accept-language': 'en',
    });
}

export function translator(namespace: string) {
    const t = (key: string) => `${namespace}.${key}`;
    return Object.assign(t, {
        rich: t,
        markup: t,
        raw: (key: string) => `${namespace}.${key}`,
        has: () => true,
    });
}
