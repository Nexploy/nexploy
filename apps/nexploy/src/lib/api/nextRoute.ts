import { createZodRoute, MiddlewareFunction } from 'next-zod-route';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const route = createZodRoute({
    handleServerError: (error: Error) => {
        console.error(`[SERVER ERROR] ${error.message}`, error);
        return NextResponse.json({ message: error.message });
    },
});

export const authRouteServer: MiddlewareFunction = async ({ next }) => {
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
