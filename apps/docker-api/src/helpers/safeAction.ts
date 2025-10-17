import type { Context } from 'hono'
import { logger } from '../utils/logger.js'

export const safeAction = (fn: (c: Context) => Promise<void>) => {
    return async (c: Context) => {
        try {
            await fn(c)
            logger.debug({ path: c.req.url })
            return c.json({ ok: true })
        } catch (err: any) {
            logger.error(err)
            return c.json({ ok: false, error: err.message || 'Internal error' }, 500)
        }
    }
}
