'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { organizationIdSchema } from '@workspace/schemas-zod/organization/organizationId.schema';
import { getTranslations } from 'next-intl/server';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { getOldestOrganizationId, isSoleOwner } from '@/services/organization.service';
import { revalidatePath } from 'next/cache';

export const leaveOrganizationAction = authActionServer
    .inputSchema(organizationIdSchema)
    .action(async ({ parsedInput: { organizationId }, ctx: { session } }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(session.user.id, organizationId);
        if (callerRole === 'owner' && (await isSoleOwner(organizationId))) {
            throw new Error(t('errors.cannotLeaveAsSoleOwner'));
        }

        const wasActiveOrganization = session.session.activeOrganizationId === organizationId;

        try {
            const result = await auth.api.leaveOrganization({
                body: { organizationId },
                headers: await headers(),
            });

            if (wasActiveOrganization) {
                await auth.api.setActiveOrganization({
                    body: { organizationId: await getOldestOrganizationId(session.user.id) },
                    headers: await headers(),
                });
            }

            await setToastServer({ type: 'success', message: t('success.left') });
            revalidatePath('/', 'layout');

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.leaveFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
