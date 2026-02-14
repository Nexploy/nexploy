'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { deleteUserSchema } from '@workspace/schemas-zod/user/deleteUser.schema';
import { getTranslations } from 'next-intl/server';

export const deleteUser = authActionServer
    .inputSchema(deleteUserSchema)
    .action(async ({ parsedInput: { userId }, ctx: { session } }) => {
        const t = await getTranslations('admin');

        if (session.user.role !== 'admin') {
            throw new Error(t('errors.adminOnly'));
        }

        if (userId === session.user.id) {
            throw new Error(t('errors.cannotDeleteOwnAccount'));
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/users');

        return { success: true };
    });
