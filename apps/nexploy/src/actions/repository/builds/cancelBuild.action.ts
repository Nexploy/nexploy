'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { cancelBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { cancelBuildRepository } from '@/services/repository/build.service.ts';
import { getTranslations } from 'next-intl/server';
import { byBuildId } from '@/lib/auth/resolveOrgContext';

export const onCancelBuild = authActionServer
    .use(requirePermission('build', 'cancel', byBuildId))
    .inputSchema(cancelBuildSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { buildId } = parsedInput;
            await cancelBuildRepository(buildId);
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
