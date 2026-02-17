'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { retryBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import {
    findBuildWithEnvInngest,
    retryBuildRepositoryInngest,
} from '@/services/inngest/build.inngest.service';
import { deleteBuildLogInngest } from '@/services/inngest/log.inngest.service';
import { getTranslations } from 'next-intl/server';

export const onRetryBuild = authActionServer
    .inputSchema(retryBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const t = await getTranslations('repository');
            const existingBuild = await findBuildWithEnvInngest(parsedInput.buildId);

            if (!existingBuild || existingBuild.status === 'COMPLETED') {
                throw new Error(t('builds.buildNotFound'));
            }

            await deleteBuildLogInngest(parsedInput.buildId);
            await retryBuildRepositoryInngest(parsedInput, ctx.session.user.id, existingBuild);
        } catch (err: unknown) {
            if (err instanceof Error) {
                const t = await getTranslations('repository');
                await setToastServer({
                    type: 'error',
                    message: err.message || t('builds.failedToRetry'),
                });
            }
            throw err;
        }
    });
