import { createMiddleware, createSafeActionClient } from 'next-safe-action';
import { HTTPError } from 'ky';
import { getUserSession } from '@/services/auth/auth.service';
import { Session } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

export const actionServer = createSafeActionClient({
    handleServerError(error) {
        console.error(`[ACTION ERROR] ${error.message}`, error);

        if (error instanceof HTTPError) {
            return error.message;
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

    if (session.user.banned) {
        await setToastServer({
            type: 'error',
            message: 'Your account has been banned',
        });
        redirect('/');
    }

    return next({ ctx: { session } });
});

export const adminOnly = createMiddleware<{ ctx: { session: Session } }>().define(
    async ({ ctx, next }) => {
        if (ctx.session.user.role !== 'admin') {
            throw new Error('Only admins can perform this action');
        }

        return next({ ctx });
    },
);

export const preventSelfAction = createMiddleware<{
    ctx: { session: Session };
}>().define(async ({ ctx, clientInput, next }) => {
    const input = clientInput as { userId?: string };
    const tAdmin = await getTranslations('admin');

    if (input.userId && input.userId === ctx.session.user.id) {
        await setToastServer({
            type: 'error',
            message: tAdmin('cannotBanYourself'),
        });
    }

    return next({ ctx });
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
