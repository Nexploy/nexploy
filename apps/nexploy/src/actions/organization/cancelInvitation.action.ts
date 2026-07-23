'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { invitationIdSchema } from '@workspace/schemas-zod/organization/invitationId.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const cancelInvitationAction = authActionServer
    .inputSchema(invitationIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const invitation = await prisma.invitation.findUnique({
            where: { id: parsedInput.invitationId },
            select: { organizationId: true },
        });
        if (!invitation) {
            throw new Error(t('errors.notFound'));
        }

        const callerRole = await getCallerOrgRole(ctx.session.user.id, invitation.organizationId);
        if (callerRole !== 'owner' && callerRole !== 'admin' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        try {
            const result = await auth.api.cancelInvitation({
                body: { invitationId: parsedInput.invitationId },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.cancelled') });
            revalidatePath(`/organizations/${invitation.organizationId}/members`);

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.cancelFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
