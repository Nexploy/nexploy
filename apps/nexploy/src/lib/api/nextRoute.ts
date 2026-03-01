import { createZodRoute, MiddlewareFunction } from 'next-zod-route';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { setToastServer } from '@/lib/toastServer';
import { auth, Session } from '@/lib/auth/auth';
import { type PermissionActions, type PermissionResource, roles } from '@/lib/auth/permissions';
import { Role } from '@workspace/schemas-zod/auth/permissions';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message });
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

export const internalApiAuth: MiddlewareFunction<
    Record<string, unknown>,
    Record<string, unknown>
> = async ({ next, request, ctx }) => {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const result = await auth.api.verifyApiKey({ body: { key: apiKey } });

    if (!result.valid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return next({ ctx });
};

export const requirePermission =
    <R extends PermissionResource>(
        resource: R,
        action: PermissionActions[R],
    ): MiddlewareFunction<{ session: Session }, { session: Session }> =>
    async ({ next, ctx }) => {
        const role = ctx.session.user.role as Role;
        const roleStatements = (
            roles[role] as { statements?: Record<string, readonly string[]> } | undefined
        )?.statements;

        if (!roleStatements?.[resource]?.includes(action as string)) {
            throw new Error(`Forbidden: missing permission ${resource}.${action as string}`);
        }

        return next({ ctx });
    };
