'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

export const onStartBuild = authActionServer
    .use(requirePermission('repository', 'deploy'))
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('repository');
        try {
            await startBuildRepositoryInngest(parsedInput, ctx.session.user.id);
            revalidatePath('/[locale]/repositories', 'page');
        } catch (err: unknown) {
            await setToastServer({
                type: 'error',
                message: err instanceof Error ? err.message : t('builds.failedToStart'),
            });
            throw err;
        }
    });
