'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepository } from '@/services/repository/build.service';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const onStartBuild = authActionServer
    .use(requirePermission('build', 'run', byRepositoryId))
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('repository');
        try {
            const newBuild = await startBuildRepository(parsedInput, ctx.session.user.id);
            revalidatePath('/repositories/[repositoryId]', 'page');
            return newBuild;
        } catch (err: unknown) {
            await setToastServer({
                type: 'error',
                message: err instanceof Error ? err.message : t('builds.failedToStart'),
            });
            throw err;
        }
    });
