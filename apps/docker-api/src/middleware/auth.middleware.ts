import { Context, Next } from 'hono';
import { HTTPError } from 'ky';
import { logger } from '@/utils/logger';
import { kyNexploy } from '@/lib/kyNexploy';

const VERIFY_CACHE_TTL_MS = 60_000;
const VERIFY_INVALID_CACHE_TTL_MS = 3_000;
const VERIFY_UNREACHABLE_CACHE_TTL_MS = 3_000;

type VerifyOutcome = 'valid' | 'invalid' | 'unreachable';

const verifyCache = new Map<string, { outcome: VerifyOutcome; expiresAt: number }>();

async function verifyApiKey(token: string): Promise<VerifyOutcome> {
    const cached = verifyCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.outcome;
    }

    let outcome: VerifyOutcome;
    let ttl: number;

    try {
        const result = await kyNexploy
            .post('internal/verify-api-key', {
                json: { key: token },
                headers: { 'x-internal-secret': process.env.ENCRYPTION_KEY ?? '' },
            })
            .json<{ valid?: boolean }>();
        outcome = result.valid ? 'valid' : 'invalid';
        ttl = outcome === 'valid' ? VERIFY_CACHE_TTL_MS : VERIFY_INVALID_CACHE_TTL_MS;
    } catch (error) {
        if (error instanceof HTTPError) {
            logger.warn(
                { status: error.response.status },
                'Nexploy rejected the API key verification request',
            );
            outcome = 'invalid';
            ttl = VERIFY_INVALID_CACHE_TTL_MS;
        } else {
            logger.warn(
                { error },
                'Nexploy is unreachable, cannot verify the API key yet (it may still be starting up)',
            );
            outcome = 'unreachable';
            ttl = VERIFY_UNREACHABLE_CACHE_TTL_MS;
        }
    }

    verifyCache.set(token, { outcome, expiresAt: Date.now() + ttl });

    return outcome;
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

    const outcome = await verifyApiKey(token);

    if (outcome === 'unreachable') {
        return c.json({ error: 'Nexploy is unavailable, try again shortly.' }, 503);
    }

    if (outcome === 'invalid') {
        logger.warn('Invalid API key');
        return c.json({ error: 'Invalid API key.' }, 401);
    }

    await next();
}
