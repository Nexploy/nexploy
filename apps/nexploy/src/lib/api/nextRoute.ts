import { createZodRoute, MiddlewareFunction } from 'next-zod-route';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { setToastServer } from '@/lib/toastServer';
import { auth, Session } from '@/lib/auth/auth';
import {
    hasPermission,
    type PermissionActions,
    type PermissionResource,
} from '@/lib/auth/permissions';
import { hasOrgPermission, type OrgPermissionResource } from '@/lib/auth/orgPermissions';
import { isOrgScopedResource } from '@/lib/auth/orgScopedResources';
import { getCallerOrgRole, type RequestOrgResolver } from '@/lib/auth/resolveOrgContext';
import { prisma } from '../../../prisma/prisma.ts';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    },
});

export const authRouteServer: MiddlewareFunction<
    Record<string, unknown>,
    { session: Session }
> = async ({ next, request }) => {
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
            request.headers.get('x-api-key') ??
            request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

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
        orgResolver?: RequestOrgResolver,
    ): MiddlewareFunction<{ session: Session }, { session: Session }> =>
    async ({ next, ctx, request }) => {
        const role = ctx.session.user.role as string;

        if (isOrgScopedResource(resource) && role !== 'admin' && orgResolver) {
            const resolved = await orgResolver(request);
            const organizationIds = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];

            if (organizationIds.length === 0) {
                throw new Error(`Forbidden: missing permission ${resource}.${action as string}`);
            }

            for (const organizationId of organizationIds) {
                const orgRole = await getCallerOrgRole(ctx.session.user.id, organizationId);
                if (!orgRole || !hasOrgPermission(orgRole, resource as OrgPermissionResource, action as string)) {
                    throw new Error(`Forbidden: missing permission ${resource}.${action as string}`);
                }
            }

            return next({ ctx });
        }

        if (!hasPermission(role, resource, action as string)) {
            throw new Error(`Forbidden: missing permission ${resource}.${action as string}`);
        }
        return next({ ctx });
    };
