'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { cancelBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { cancelBuildInngest } from '@/services/inngest/build.inngest.service';
import { getTranslations } from 'next-intl/server';

export const onCancelBuild = authActionServer
    .use(requirePermission('build', 'cancel'))
    .inputSchema(cancelBuildSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { buildId } = parsedInput;
            await cancelBuildInngest(buildId);
        } catch (err: unknown) {
            const t = await getTranslations('repository');
            const message = err instanceof Error ? err.message : t('builds.failedToCancel');
            await setToastServer({
                type: 'error',
                message,
            });
            throw err;
        }
    });
