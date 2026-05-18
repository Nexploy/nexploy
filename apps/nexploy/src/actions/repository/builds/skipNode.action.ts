'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { skipNodeSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { skipNodeRepository } from '@/services/repository/build.service.ts';
import { getTranslations } from 'next-intl/server';

export const onSkipNode = authActionServer
    .use(requirePermission('build', 'cancel'))
    .inputSchema(skipNodeSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { buildId, nodeId } = parsedInput;
            await skipNodeRepository(buildId, nodeId);
        } catch (err: unknown) {
            const t = await getTranslations('repository');
            const message = err instanceof Error ? err.message : t('builds.failedToCancel');
            await setToastServer({ type: 'error', message });
            throw err;
        }
    });
