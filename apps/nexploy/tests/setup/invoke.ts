import { expect } from 'vitest';
import { currentSessionCookie } from './session';

export const FORBIDDEN_MESSAGE = 'common.forbidden';

export interface ActionResult<T = unknown> {
    data?: T;
    serverError?: string;
    validationErrors?: unknown;
}

export type RouteHandler = (
    request: Request,
    context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export interface CallRouteOptions {
    method?: string;
    url?: string;
    params?: Record<string, string>;
    searchParams?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
}

export async function callRoute(handler: RouteHandler, options: CallRouteOptions = {}): Promise<Response> {
    const { method = 'GET', params = {}, searchParams, body, headers = {} } = options;

    const url = new URL(options.url ?? 'http://localhost:3022/api/test');
    for (const [key, value] of Object.entries(searchParams ?? {})) {
        url.searchParams.set(key, value);
    }

    const cookie = currentSessionCookie();

    const isFormData = body instanceof FormData;

    const request = new Request(url, {
        method,
        headers: {
            ...(cookie ? { cookie } : {}),
            ...(body !== undefined && !isFormData ? { 'content-type': 'application/json' } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });

    return handler(request, { params: Promise.resolve(params) });
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
    return (await response.clone().json()) as T;
}

export function expectActionForbidden(result: ActionResult | undefined, denyMessage = FORBIDDEN_MESSAGE) {
    expect(result?.serverError, `expected a forbidden serverError, got ${JSON.stringify(result)}`).toBe(denyMessage);
    expect(result?.data).toBeUndefined();
}

export function expectActionAllowed(result: ActionResult | undefined, denyMessage = FORBIDDEN_MESSAGE) {
    expect(
        result?.serverError,
        `expected the action to pass its permission guard, got ${JSON.stringify(result)}`,
    ).not.toBe(denyMessage);
}

export function expectRouteForbidden(response: Response) {
    expect(response.status, 'expected the route to deny the caller').toBe(403);
}

export function expectRouteAllowed(response: Response) {
    expect(response.status, 'expected the route to pass its permission guard').not.toBe(403);
}
