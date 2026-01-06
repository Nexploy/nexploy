import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
        logger.warn('Missing Authorization header');
        return c.json({ error: 'Missing Authorization header' }, 401);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        logger.warn('Invalid Authorization header format');
        return c.json(
            { error: 'Invalid Authorization header format. Expected: Bearer <token>' },
            401,
        );
    }

    if (!constantTimeCompare(token, process.env.INTERNAL_API_KEY as string)) {
        logger.warn('Invalid API key');
        return c.json({ error: 'Invalid API key' }, 401);
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
