'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { disconnectGitAccount } from '@/services/git/git.service';
import { disconnectGitAccountSchema } from '@workspace/schemas-zod/git/gitAccount.schema';

export const disconnectGitAccountAction = authActionServer
    .inputSchema(disconnectGitAccountSchema)
    .action(async ({ parsedInput, ctx }) => {
        await disconnectGitAccount(ctx.session.user.id, parsedInput.gitProviderId);
        return { success: true };
    });
