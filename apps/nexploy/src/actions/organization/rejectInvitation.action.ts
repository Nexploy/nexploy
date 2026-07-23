'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { invitationIdSchema } from '@workspace/schemas-zod/organization/invitationId.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';

export const rejectInvitationAction = authActionServer
    .inputSchema(invitationIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const invitation = await prisma.invitation.findUnique({
            where: { id: parsedInput.invitationId },
            select: { email: true },
        });
        if (!invitation || invitation.email !== ctx.session.user.email) {
            throw new Error(t('errors.notFound'));
        }

        try {
            const result = await auth.api.rejectInvitation({
                body: { invitationId: parsedInput.invitationId },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.rejected') });
            revalidatePath('/account');

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.rejectFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
