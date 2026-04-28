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
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        const t = await getTranslations('repository.reassociateGitAccount');
        try {
            await relinkGitAccount(repositoryId, parsedInput.gitAccountId);

            revalidatePath('/[locale]/(app)/repositories/[repositoryId]', 'page');
            await setToastServer({ type: 'success', message: t('success') });
        } catch (error: unknown) {
            const isNotAccessible =
                error instanceof Error && error.message === 'REPO_NOT_ACCESSIBLE';
            await setToastServer({
                type: 'error',
                message: isNotAccessible ? t('repoNotAccessible') : t('error'),
            });
        }
    });
