'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { moveRepositoryToOrganizationSchema } from '@workspace/schemas-zod/repository/settings/moveRepositoryToOrganization.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { moveRepositoryToOrganization } from '@/services/repository.service';
import { getTranslations } from 'next-intl/server';
import { byBoundRepositoryId, getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { hasOrgPermission } from '@/lib/auth/orgPermissions';

export const moveRepositoryToOrganizationAction = authActionServer
    .metadata({ name: 'repository.moveToOrganization' })
    .use(requirePermission('repository', 'update', byBoundRepositoryId))
    .inputSchema(moveRepositoryToOrganizationSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId], ctx: { session } }) => {
        const t = await getTranslations('repository.settings.organization');
        const tCommon = await getTranslations('common');

        const isGlobalAdmin = session.user.role === 'admin';

        if (!isGlobalAdmin) {
            const targetRole = await getCallerOrgRole(session.user.id, parsedInput.organizationId);
            if (!targetRole || !hasOrgPermission(targetRole, 'repository', 'create')) {
                await setToastServer({ type: 'error', message: tCommon('forbidden') });
                throw new Error(tCommon('forbidden'));
            }
        }

        try {
            await moveRepositoryToOrganization(repositoryId, parsedInput.organizationId);
            await setToastServer({ type: 'success', message: t('moveSuccess') });
            revalidatePath('/repositories/[repositoryId]', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
