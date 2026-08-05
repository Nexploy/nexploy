import { createZodRoute, MiddlewareFunction } from 'next-zod-route';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { setToastServer } from '@/lib/toastServer';
import { auth, Session } from '@/lib/auth/auth';
import { hasPermission, type PermissionActions, type PermissionResource } from '@/lib/auth/permissions';
import { canOnOwnedResource } from '@/lib/auth/canOnOwnedResource';
import { isOrgScopedResource, type OrgScopedResource } from '@/lib/auth/orgScopedResources';
import { getCallerOrgRole, HOST_OWNED, HOST_SCOPED, type RequestOrgScopeResolver } from '@/lib/auth/resolveOrgContext';
import { prisma } from '../../../prisma/prisma.ts';
import type { ActivityStatus } from '@workspace/typescript-interface/activity';
import { recordActivity } from '@/lib/activity/recordActivity';
import { ForbiddenError, isForbiddenError } from '@/lib/activity/forbiddenError';
import type { OrgScopeArgs } from '@workspace/typescript-interface/auth/orgScope';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        if (isForbiddenError(error)) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }

        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    },
});

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function readAuditInput(request: Request): Promise<Record<string, unknown>> {
    const path = new URL(request.url).pathname;

    try {
        const body = await request.clone().json();

        return body && typeof body === 'object' && !Array.isArray(body) ? { ...body, path } : { body, path };
    } catch {
        return { path };
    }
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
    try {
        const body = await response.clone().json();
        return typeof body?.message === 'string' ? body.message : undefined;
    } catch {
        return undefined;
    }
}

export const auditRoute =
    (name: string): MiddlewareFunction<Record<string, unknown>, Record<string, unknown>> =>
    async ({ next, request }) => {
        if (!AUDITED_METHODS.has(request.method)) return next();

        const startedAt = Date.now();
        const input = await readAuditInput(request);
        const response = await next();

        const status: ActivityStatus =
            response.status < 400 ? 'SUCCESS' : response.status === 403 ? 'DENIED' : 'FAILURE';

        await recordActivity({
            name,
            source: 'API_ROUTE',
            status,
            input,
            durationMs: Date.now() - startedAt,
            errorMessage: status === 'SUCCESS' ? undefined : await readErrorMessage(response),
        });

        return response;
    };

export const authRouteServer: MiddlewareFunction<Record<string, unknown>, { session: Session }> = async ({
    next,
    request,
}) => {
    const session = await getUserSession(request.headers);

    if (!session) {
        await setToastServer({
            type: 'error',
            message: 'Unauthorized action attempt',
        });

        return new Response(JSON.stringify({ message: 'Unauthorized action attempt' }), {
            status: 403,
        });
    }

    return next({ ctx: { session } });
};

export function internalApiAuth(
    expectedMetadata: Record<string, unknown>,
): MiddlewareFunction<Record<string, unknown>, { userId: string; role: string }> {
    return async ({ next, request }) => {
        const apiKeyHeader =
            request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

        if (!apiKeyHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const result = await auth.api.verifyApiKey({ body: { key: apiKeyHeader } });

        if (!result.valid || !result.key || !result.key.referenceId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const metadata = result.key.metadata as Record<string, unknown> | null;
        for (const [key, value] of Object.entries(expectedMetadata)) {
            if (metadata?.[key] !== value) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
            }
        }

        const userId = result.key.referenceId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const role = user?.role ?? 'read';

        return next({ ctx: { userId, role } });
    };
}

export const requirePermission =
    <R extends PermissionResource>(
        resource: R,
        action: PermissionActions[R],
        ...[orgResolver]: OrgScopeArgs<R, OrgScopedResource, RequestOrgScopeResolver>
    ): MiddlewareFunction<{ session: Session }, { session: Session }> =>
    async ({ next, ctx, request }) => {
        const role = ctx.session.user.role as string;

        if (isOrgScopedResource(resource) && role !== 'admin' && orgResolver !== HOST_SCOPED) {
            if (!orgResolver) {
                throw new ForbiddenError(`Forbidden: missing permission ${resource}.${action as string}`);
            }

            const resolved = await orgResolver(request);
            const organizationIds = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];

            if (organizationIds.length === 0) {
                throw new ForbiddenError(`Forbidden: missing permission ${resource}.${action as string}`);
            }

            for (const organizationId of organizationIds) {
                const owner = organizationId === HOST_OWNED ? null : organizationId;
                const orgRole = owner ? await getCallerOrgRole(ctx.session.user.id, owner) : null;

                if (!canOnOwnedResource({ role, orgRole, organizationId: owner }, resource, action as string, owner)) {
                    throw new ForbiddenError(`Forbidden: missing permission ${resource}.${action as string}`);
                }
            }

            return next({ ctx });
        }

        if (!hasPermission(role, resource, action as string)) {
            throw new ForbiddenError(`Forbidden: missing permission ${resource}.${action as string}`);
        }
        return next({ ctx });
    };
