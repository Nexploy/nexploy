import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { getTranslations } from '@/middleware/locale.middleware';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
        logger.warn('Missing Authorization header');
        const t = getTranslations(c, 'docker');
        return c.json({ error: t('errors.missingAuthHeader') }, 401);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        logger.warn('Invalid Authorization header format');
        const t = getTranslations(c, 'docker');
        return c.json({ error: t('errors.invalidAuthFormat') }, 401);
    }

    if (!constantTimeCompare(token, process.env.NEXPLOY_API_KEY as string)) {
        logger.warn('Invalid API key');
        const t = getTranslations(c, 'docker');
        return c.json({ error: t('errors.invalidApiKey') }, 401);
    }

    await next();
}

function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}
