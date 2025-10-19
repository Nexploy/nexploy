import type { Context } from 'hono';
import { logger } from '@/utils/logger';

export const safeAction = (fn: (c: Context) => Promise<void>) => {
    return async (c: Context) => {
        try {
            await fn(c);
            logger.debug({ path: c.req.url });
            return c.json({ ok: true });
        } catch (err: any) {
            logger.error(err);
            return c.json({ ok: false, message: err.json.message || 'Internal error' }, 500);
        }
    };
};
