'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { disconnectGitAccount } from '@/services/git/gitAccounts.service';
import { disconnectGitAccountSchema } from '@workspace/schemas-zod/git/gitAccount.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const disconnectGitAccountAction = authActionServer
    .inputSchema(disconnectGitAccountSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            await disconnectGitAccount(ctx.session.user.id, parsedInput.gitProviderId);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
