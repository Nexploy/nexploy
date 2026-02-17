import { createZodRoute, MiddlewareFunction } from 'next-zod-route';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { setToastServer } from '@/lib/toastServer';
import { Session } from '@/lib/auth/auth';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message });
    },
});

export const authRouteServer: MiddlewareFunction<
    Record<string, unknown>,
    { session: Session }
> = async ({ next }) => {
    const session = await getUserSession();

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

export const adminOnly: MiddlewareFunction<{ session: Session }, { session: Session }> = async ({
    next,
    ctx,
}) => {
    if (ctx.session.user.role !== 'admin') {
        throw new Error('Only admins can perform this action');
    }

    return next({ ctx });
};
