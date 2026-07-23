'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { updateOrganizationSchema } from '@workspace/schemas-zod/organization/updateOrganization.schema';
import { getTranslations } from 'next-intl/server';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const updateOrganizationAction = authActionServer
    .inputSchema(updateOrganizationSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole !== 'owner' && callerRole !== 'admin' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        try {
            const organization = await auth.api.updateOrganization({
                body: {
                    organizationId: parsedInput.organizationId,
                    data: { name: parsedInput.name },
                },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.renamed') });
            revalidatePath(`/organizations/${parsedInput.organizationId}/settings`);

            return organization;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.updateFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
