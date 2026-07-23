'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setToastServer } from '@/lib/toastServer';
import { updateMemberRoleSchema } from '@workspace/schemas-zod/organization/updateMemberRole.schema';
import { getTranslations } from 'next-intl/server';
import { prisma } from '../../../prisma/prisma';
import { getCallerOrgRole } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const updateMemberRoleAction = authActionServer
    .inputSchema(updateMemberRoleSchema)
    .action(async ({ parsedInput, ctx }) => {
        const t = await getTranslations('organization');

        const callerRole = await getCallerOrgRole(ctx.session.user.id, parsedInput.organizationId);
        if (callerRole !== 'owner' && ctx.session.user.role !== 'admin') {
            throw new Error(t('errors.notFound'));
        }

        const target = await prisma.member.findUnique({
            where: { id: parsedInput.memberId },
            select: { role: true, organizationId: true },
        });
        if (!target || target.organizationId !== parsedInput.organizationId) {
            throw new Error(t('errors.notFound'));
        }

        if (target.role === 'owner') {
            const ownerCount = await prisma.member.count({
                where: { organizationId: parsedInput.organizationId, role: 'owner' },
            });
            if (ownerCount <= 1) {
                throw new Error(t('errors.cannotDemoteLastOwner'));
            }
        }

        try {
            const result = await auth.api.updateMemberRole({
                body: {
                    organizationId: parsedInput.organizationId,
                    memberId: parsedInput.memberId,
                    role: parsedInput.role,
                },
                headers: await headers(),
            });

            await setToastServer({ type: 'success', message: t('success.roleUpdated') });
            revalidatePath(`/organizations/${parsedInput.organizationId}/members`);

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('errors.updateRoleFailed');
            await setToastServer({ type: 'error', message });
            throw error;
        }
    });
