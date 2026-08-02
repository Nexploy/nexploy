import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { describeActor } from '@workspace/shared/actor';
import { getActor } from '@/middleware/auth.middleware';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function actorAuditMiddleware(c: Context, next: Next) {
    if (!AUDITED_METHODS.has(c.req.method)) return next();

    const actor = getActor(c);

    await next();

    logger.info(
        {
            actor: describeActor(actor),
            actorId: actor.userId,
            actorRole: actor.role,
            actorOrganizationId: actor.organizationId,
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
        },
        'Docker mutation',
    );
}
