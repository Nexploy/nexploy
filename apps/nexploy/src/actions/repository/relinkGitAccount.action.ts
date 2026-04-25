'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { relinkGitAccountSchema } from '@workspace/schemas-zod/repository/relinkGitAccount.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { relinkGitAccount } from '@/services/repository.service';

export const relinkGitAccountAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(relinkGitAccountSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await relinkGitAccount(repositoryId, parsedInput.gitAccountId);

            revalidatePath('/[locale]/(app)/repositories/[repositoryId]', 'page');
        } catch {
            await setToastServer({ type: 'error', message: 'Failed to relink Git account' });
        }
    });
