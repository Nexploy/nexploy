'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

export const onStartBuild = authActionServer
    .use(requirePermission('repository', 'deploy'))
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            await startBuildRepositoryInngest(parsedInput, ctx.session.user.id);

            revalidatePath('/[locale]/repositories', 'page');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                const t = await getTranslations('repository');
                await setToastServer({
                    type: 'error',
                    message: err.message || t('builds.failedToStart'),
                });
            }
        }
    });
