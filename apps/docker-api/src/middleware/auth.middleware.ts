import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { kyNexploy } from '@/lib/kyNexploy';

const VERIFY_CACHE_TTL_MS = 60_000;
const VERIFY_FAILURE_CACHE_TTL_MS = 3_000;
const verifyCache = new Map<string, { valid: boolean; expiresAt: number }>();

async function verifyApiKey(token: string): Promise<boolean> {
    const cached = verifyCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.valid;
    }

    let valid = false;
    let ttl = VERIFY_CACHE_TTL_MS;

    try {
        const result = await kyNexploy
            .post('internal/verify-api-key', {
                json: { key: token },
                headers: { 'x-internal-secret': process.env.ENCRYPTION_KEY ?? '' },
            })
            .json<{ valid?: boolean }>();
        valid = Boolean(result.valid);
    } catch (error) {
        logger.error({ error }, 'Failed to verify API key against nexploy');
        valid = false;
        ttl = VERIFY_FAILURE_CACHE_TTL_MS;
    }

    verifyCache.set(token, { valid, expiresAt: Date.now() + ttl });

    return valid;
}

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

    if (!(await verifyApiKey(token))) {
        logger.warn('Invalid API key');
        return c.json({ error: 'Invalid API key.' }, 401);
    }

    await next();
}
