'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { updateUserRoleSchema } from '@workspace/schemas-zod/user/updateUserRole.schema';
import { getTranslations } from 'next-intl/server';

export const updateUserRole = authActionServer
    .inputSchema(updateUserRoleSchema)
    .action(async ({ parsedInput: { userId, role }, ctx: { session } }) => {
        const t = await getTranslations('admin');

        if (session.user.role !== 'admin') {
            throw new Error(t('errors.adminOnly'));
        }

        if (userId === session.user.id) {
            throw new Error(t('errors.cannotChangeOwnRole'));
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath('/admin/users');

        return { user };
    });
