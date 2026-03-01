'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { updateUserRoleSchema } from '@workspace/schemas-zod/user/updateUserRole.schema';
import { getTranslations } from 'next-intl/server';

export const updateUserRole = authActionServer
    .use(requirePermission('user', 'set-role'))
    .inputSchema(updateUserRoleSchema)
    .action(async ({ parsedInput: { userId, role }, ctx: { session } }) => {
        const t = await getTranslations('admin');

        if (userId === session.user.id) {
            throw new Error(t('errors.cannotChangeOwnRole'));
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (targetUser?.role === 'system') {
            throw new Error(t('errors.cannotModifySystemUser'));
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath('/admin/users');

        return { user };
    });
