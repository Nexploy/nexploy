import { createSafeActionClient } from 'next-safe-action';
import { HttpErrorResponse } from 'drino';

export const actionServer = createSafeActionClient({
    handleServerError(error) {
        console.error(`[ACTION ERROR] ${error.message}`, error);

        if (error instanceof HttpErrorResponse) {
            return error.error.message;
        }

        return error.message || 'Error occurred';
    },
});

// export const authActionServer = actionServer
//     .use(async ({ next }) => {
//         const session = await getUserSession();
//
//         if (!session) {
//             console.warn('[AUTH ACTION] Unauthorized action attempt');
//             redirect('/');
//         }
//
//         console.info(`[AUTH ACTION] Session: ${session?.user?.id}`);
//
//         return next({ ctx: { session } });
//     });
//
