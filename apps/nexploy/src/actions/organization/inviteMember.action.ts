'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { inviteMemberSchema } from '@workspace/schemas-zod/organization/inviteMember.schema';
import { getTranslations } from 'next-intl/server';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';

export const inviteMemberAction = authActionServer
    .inputSchema(inviteMemberSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole !== 'owner' && callerRole !== 'admin' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        const invitedUser = await prisma.user.findUnique({
            where: { email: parsedInput.email },
            select: { id: true },
        });
        if (!invitedUser) {
            throw new Error(t('errors.userNotFound'));
        }

        try {
            const invitation = await auth.api.createInvitation({
                body: {
                    organizationId: parsedInput.organizationId,
                    email: parsedInput.email,
                    role: parsedInput.role,
                },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.invited') });
            revalidatePath(`/organizations/${parsedInput.organizationId}/members`);

            return invitation;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.inviteFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
