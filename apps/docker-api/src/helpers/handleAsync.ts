import type { Context } from 'hono';
import { logger } from '../utils/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

type Handler = (c: Context) => Promise<any>

export const handleAsync = (fn: Handler, opts?: { status?: ContentfulStatusCode }) => {
    const status = opts?.status ?? 200
    return async (c: Context) => {
        try {
            const result = await Promise.race([
                fn(c),
                new Promise((_, rej) => setTimeout(() => rej(new Error('request timeout')), Number(process.env.REQUEST_TIMEOUT_MS || 30_000)))
            ])
            logger.debug({ path: c.req.url })
            return c.json(result, status)
        } catch (err: any) {
            logger.error({ err, path: c.req.url, method: c.req.method }, 'handler error')

            const message = process.env.NODE_ENV === 'production' ? 'internal server error' : (err.message || String(err))
            const status = (err && err.status) ? err.status : 500
            return c.json({ error: message }, status)
        }
    }
}
