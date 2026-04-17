import type { Context } from 'hono';
import { logger } from '@/utils/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

function resolveError(err: any): { message: string; status: ContentfulStatusCode } {
    const statusCode = err.statusCode === 304 ? 409 : err.statusCode;
    return { message: err.reason ?? err.message, status: statusCode ?? err.status ?? 500 };
}

export const handleAsync = <C extends Context = Context>(
    fn: (c: C) => Promise<any>,
    opts?: { status?: ContentfulStatusCode },
) => {
    const successStatus = opts?.status ?? 200;

    return async (c: C) => {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout.')), 3_600_000),
        );

        try {
            const result = await Promise.race([fn(c), timeoutPromise]);
            logger.debug({ path: c.req.url });
            return c.json(result ?? { ok: true }, successStatus);
        } catch (err: any) {
            const { message, status } = resolveError(err);

            if (status >= 500) {
                logger.error({ err, path: c.req.url, method: c.req.method }, 'handler error');
            } else {
                logger.warn({ message, status, path: c.req.url }, 'client error');
            }

            return c.json({ message }, status);
        }
    };
};
