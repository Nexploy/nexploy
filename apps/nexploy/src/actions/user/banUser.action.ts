'use server';

import { authActionServer, preventSelfAction, requirePermission } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { banUsersSchema } from '@workspace/schemas-zod/user/banUsersSchema';
import { prisma } from '../../../prisma/prisma';
import { getTranslations } from 'next-intl/server';

export const banUser = authActionServer
    .use(requirePermission('user', 'ban'))
    .use(preventSelfAction)
    .inputSchema(banUsersSchema)
    .action(async ({ parsedInput: { userId, reason, action }, ctx }) => {
        const t = await getTranslations('admin');
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, promotedById: true },
        });
        if (targetUser?.role === 'system') {
            throw new Error(t('errors.cannotModifySystemUser'));
        }
        if (targetUser?.role === 'admin' && targetUser.promotedById !== ctx.session.user.id) {
            throw new Error(t('errors.cannotModifyAnotherAdmin'));
        }

        try {
            const apiMethod = action === 'ban' ? auth.api.banUser : auth.api.unbanUser;

            await apiMethod({
                body: {
                    userId,
                    ...(action === 'ban' && reason && { banReason: reason }),
                },
                headers: await headers(),
            });

            revalidatePath('/admin/users');
            return action;
        } catch (error: unknown) {
            throw new Error(t('errors.banFailed'));
        }
    });
