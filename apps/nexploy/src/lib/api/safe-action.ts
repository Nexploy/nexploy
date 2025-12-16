import { createMiddleware, createSafeActionClient } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';
import { getUserSession } from '@/services/auth/auth.service';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { cookies } from 'next/headers';

export const actionServer = createSafeActionClient({
    handleServerError(error) {
        console.error(`[ACTION ERROR] ${error.message}`, error);

        if (error instanceof HttpErrorResponse) {
            return error.error.message;
        }

        return error.message || 'Error occurred';
    },
});

export const authActionServer = actionServer.use(async ({ next }) => {
    const session = await getUserSession();

    if (!session) {
        await setToastServer({
            type: 'error',
            message: 'Unauthorized action attempt',
        });
        redirect('/');
    }

    return next({ ctx: { session } });
});

export const injectDockerApiCookie = createMiddleware().define(async ({ ctx, next }) => {
    const cookieStore = await cookies();
    const environmentId = cookieStore.get('X-Docker-Environment')?.value || null;

    return next({
        ctx: {
            ...ctx,
            environmentId,
        },
    });
});
