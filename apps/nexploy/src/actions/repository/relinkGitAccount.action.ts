'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { relinkGitAccountSchema } from '@workspace/schemas-zod/repository/relinkGitAccount.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { relinkGitAccount } from '@/services/repository.service';
import { getTranslations } from 'next-intl/server';

export const relinkGitAccountAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(relinkGitAccountSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId], ctx: { session } }) => {
        const t = await getTranslations('repository.reassociateGitAccount');
        try {
            await relinkGitAccount(
                repositoryId,
                parsedInput.gitAccountId,
                session.user.id,
                session.user.role === 'admin',
            );
            revalidatePath('/repositories/[repositoryId]', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                const isNotAccessible = error.message === 'REPO_NOT_ACCESSIBLE';
                await setToastServer({
                    type: 'error',
                    message: isNotAccessible ? t('repoNotAccessible') : error.message,
                });
            }
            throw error;
        }
    });
