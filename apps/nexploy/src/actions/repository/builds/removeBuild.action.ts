'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { removeBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { removeBuild } from '@/services/repository/build.service.ts';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { byBuildId, resolveOrganizationIdForBuild } from '@/lib/auth/resolveOrgContext';

export const onRemoveBuild = authActionServer
    .use(requirePermission('build', 'delete', byBuildId))
    .inputSchema(removeBuildSchema)
    .action(async ({ parsedInput: { buildId } }) => {
        try {
            const organizationId = await resolveOrganizationIdForBuild(buildId);
            if (!organizationId) {
                throw new Error('Build not found');
            }
            await removeBuild(buildId, organizationId);

            const t = await getTranslations('repository.builds');
            await setToastServer({ type: 'success', message: t('removeSuccess') });

            revalidatePath('/repositories', 'page');
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
