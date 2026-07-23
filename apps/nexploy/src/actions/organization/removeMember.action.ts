'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { removeMemberSchema } from '@workspace/schemas-zod/organization/removeMember.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const removeMemberAction = authActionServer
    .inputSchema(removeMemberSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole !== 'owner' && callerRole !== 'admin' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        const target = await prisma.member.findFirst({
            where: {
                organizationId: parsedInput.organizationId,
                OR: [{ id: parsedInput.memberIdOrEmail }, { user: { email: parsedInput.memberIdOrEmail } }],
            },
            select: { role: true },
        });

        if (target?.role === 'owner') {
            const ownerCount = await prisma.member.count({
                where: { organizationId: parsedInput.organizationId, role: 'owner' },
            });
            if (ownerCount <= 1) {
                throw new Error(t('errors.cannotRemoveLastOwner'));
            }
        }

        try {
            const result = await auth.api.removeMember({
                body: {
                    organizationId: parsedInput.organizationId,
                    memberIdOrEmail: parsedInput.memberIdOrEmail,
                },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.removed') });
            revalidatePath(`/organizations/${parsedInput.organizationId}/members`);

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.removeMemberFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
