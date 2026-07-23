'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { organizationIdSchema } from '@workspace/schemas-zod/organization/organizationId.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const leaveOrganizationAction = authActionServer
    .inputSchema(organizationIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole === 'owner') {
            const ownerCount = await prisma.member.count({
                where: { organizationId: parsedInput.organizationId, role: 'owner' },
            });
            if (ownerCount <= 1) {
                throw new Error(t('errors.cannotLeaveAsSoleOwner'));
            }
        }

        try {
            const result = await auth.api.leaveOrganization({
                body: { organizationId: parsedInput.organizationId },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.left') });
            revalidatePath('/organizations');
            revalidatePath('/', 'layout');

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.leaveFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
