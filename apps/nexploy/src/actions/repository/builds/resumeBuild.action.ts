'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { resumeBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import {
    findBuildWithEnvInngest,
    resumeBuildRepositoryInngest,
} from '@/services/inngest/build.inngest.service';
import { getTranslations } from 'next-intl/server';

export const onResumeBuild = authActionServer
    .use(requirePermission('repository', 'deploy'))
    .inputSchema(resumeBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const t = await getTranslations('repository');
            const existingBuild = await findBuildWithEnvInngest(parsedInput.buildId);

            if (!existingBuild || existingBuild.status === 'COMPLETED') {
                throw new Error(t('builds.buildNotCompleted'));
            }

            if (existingBuild.status !== 'FAILED') {
                throw new Error(t('builds.buildNotFailed'));
            }

            await resumeBuildRepositoryInngest(parsedInput, ctx.session.user.id, existingBuild);

            await setToastServer({
                type: 'success',
                message: t('builds.buildResumedFromStep', {
                    step: parsedInput.startFromStep || 'beginning',
                }),
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                const t = await getTranslations('repository');
                await setToastServer({
                    type: 'error',
                    message: err.message || t('builds.failedToResume'),
                });
            }
            throw err;
        }
    });
