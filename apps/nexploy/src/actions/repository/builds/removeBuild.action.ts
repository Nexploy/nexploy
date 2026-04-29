'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { removeBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { removeBuild } from '@/services/inngest/build.inngest.service';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

export const onRemoveBuild = authActionServer
    .use(requirePermission('build', 'delete'))
    .inputSchema(removeBuildSchema)
    .action(async ({ parsedInput: { buildId } }) => {
        try {
            await removeBuild(buildId);

            const t = await getTranslations('repository.builds');
            await setToastServer({ type: 'success', message: t('removeSuccess') });

            revalidatePath('/repositories/[repositoryId]', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
