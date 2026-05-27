import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
        logger.warn('Missing Authorization header');
        return c.json({ error: 'Missing Authorization header.' }, 401);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        logger.warn('Invalid Authorization header format');
        return c.json(
            { error: 'Invalid Authorization header format. Expected: Bearer <token>.' },
            401,
        );
    }

    const expected = process.env.NEXPLOY_API_KEY ?? '';
    if (!constantTimeCompare(token, expected)) {
        logger.warn('Invalid API key');
        return c.json({ error: 'Invalid API key.' }, 401);
    }

    await next();
}

function constantTimeCompare(a: string, b: string): boolean {
    const maxLen = Math.max(a.length, b.length);
    let result = a.length ^ b.length;
    for (let i = 0; i < maxLen; i++) {
        result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return result === 0;
}
