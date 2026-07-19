'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { deleteUserSchema } from '@workspace/schemas-zod/user/deleteUser.schema';
import { getTranslations } from 'next-intl/server';

export const deleteUser = authActionServer
    .use(requirePermission('user', 'delete'))
    .inputSchema(deleteUserSchema)
    .action(async ({ parsedInput: { userId }, ctx: { session } }) => {
        const t = await getTranslations('admin');

        if (userId === session.user.id) {
            throw new Error(t('errors.cannotDeleteOwnAccount'));
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, promotedById: true },
        });
        if (targetUser?.role === 'system') {
            throw new Error(t('errors.cannotModifySystemUser'));
        }
        if (targetUser?.role === 'admin' && targetUser.promotedById !== session.user.id) {
            throw new Error(t('errors.cannotModifyAnotherAdmin'));
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/users');

        return { success: true };
    });
