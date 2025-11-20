import { createSafeActionClient } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';
import { getUserSession } from '@/services/auth/auth.service';
import { redirect } from 'next/navigation';
import { setToastServer } from '@/components/utils/toaster/toastServer';

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
