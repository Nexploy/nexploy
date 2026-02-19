import type { Context } from 'hono';
import { logger } from '@/utils/logger';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getTranslations } from '@/middleware/locale.middleware';

export const handleAsync = <C extends Context = Context>(
    fn: (c: C) => Promise<any>,
    opts?: { status?: ContentfulStatusCode },
) => {
    const status = opts?.status ?? 200;
    return async (c: C) => {
        try {
            const t = getTranslations(c as any, 'docker');
            const result = await Promise.race([
                fn(c),
                new Promise((_, rej) =>
                    setTimeout(() => rej(new Error(t('errors.requestTimeout'))), Number(3_600_000)),
                ),
            ]);
            logger.debug({ path: c.req.url });
            return c.json(result ?? { ok: true }, status);
        } catch (err: any) {
            logger.error({ err, path: c.req.url, method: c.req.method }, 'handler error');

            const message = err.message;
            const status = err.statusCode || err.status || 500;

            return c.json({ message }, status);
        }
    };
};
