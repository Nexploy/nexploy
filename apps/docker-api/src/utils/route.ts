import { zValidator } from '@hono/zod-validator';
import type { Context, MiddlewareHandler, ValidationTargets } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    AnySchema,
    HandleOpts,
    SchemaRecord,
    TypedContext,
} from '@workspace/typescript-interface/hono';
import { HttpError } from '@workspace/shared/http-error';
import { logger } from '@/utils/logger';

export { HttpError } from '@workspace/shared/http-error';
export type { TypedContext } from '@workspace/typescript-interface/hono';

interface ResolvedError {
    message: string;
    status: ContentfulStatusCode;
}

function resolveError(err: unknown): ResolvedError {
    if (err instanceof HttpError) {
        return { message: err.message, status: err.status as ContentfulStatusCode };
    }

    if (err instanceof Error) {
        const e = err as Error & {
            statusCode?: number;
            status?: number;
            json?: { message?: string };
        };

        const status = (e.statusCode === 304 ? 409 : e.statusCode) ?? e.status;
        const message = e.json?.message ?? e.message;

        if (status !== undefined) {
            return { message, status: status as ContentfulStatusCode };
        }
    }

    return { message: 'Internal server error', status: 500 };
}

function clientMessage(resolved: ResolvedError): string {
    return resolved.status >= 500 ? 'Internal server error' : resolved.message;
}

const DEFAULT_TIMEOUT_MS = 120_000;

function makeHandler<C extends Context>(
    fn: (c: C) => Promise<unknown>,
    opts?: HandleOpts,
): MiddlewareHandler {
    const successStatus = (opts?.status ?? 200) as ContentfulStatusCode;
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return async (c, next) => {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new HttpError('Request timeout.', 408)), timeoutMs),
        );

        try {
            const result = await Promise.race([fn(c as C), timeout]);
            logger.debug({ path: c.req.url });
            return c.json(result ?? { ok: true }, successStatus);
        } catch (err: unknown) {
            const resolved = resolveError(err);

            if (resolved.status >= 500) {
                logger.error({ err, path: c.req.url, method: c.req.method }, 'handler error');
            } else {
                logger.warn(
                    { message: resolved.message, status: resolved.status, path: c.req.url },
                    'client error',
                );
            }

            return c.json({ message: clientMessage(resolved) }, resolved.status);
        }
    };
}

export function route(fn: (c: Context) => Promise<unknown>, opts?: HandleOpts): MiddlewareHandler;
export function route<S extends SchemaRecord>(
    schemas: S,
    fn: (c: TypedContext<S>) => Promise<unknown>,
    opts?: HandleOpts,
): MiddlewareHandler;
export function route<S extends SchemaRecord>(
    schemasOrFn: S | ((c: Context) => Promise<unknown>),
    fnOrOpts?: ((c: TypedContext<S>) => Promise<unknown>) | HandleOpts,
    opts?: HandleOpts,
): MiddlewareHandler {
    if (typeof schemasOrFn === 'function') {
        return makeHandler(schemasOrFn, fnOrOpts as HandleOpts | undefined);
    }

    const schemas = schemasOrFn;
    const fn = fnOrOpts as (c: TypedContext<S>) => Promise<unknown>;

    const validators = (Object.entries(schemas) as [keyof ValidationTargets, AnySchema][])
        .filter(([, schema]) => schema != null)
        .map(([target, schema]) =>
            zValidator(target, schema, (result, c) => {
                if (!result.success) {
                    return c.json({ message: 'Validation failed' }, 400 as ContentfulStatusCode);
                }
            }),
        );

    return async (c, next) => {
        for (const validator of validators) {
            const response = await (validator as unknown as MiddlewareHandler)(c, async () => {});
            if (response instanceof Response) {
                return response;
            }
        }
        return makeHandler(fn as (c: Context) => Promise<unknown>, opts)(c, next);
    };
}
