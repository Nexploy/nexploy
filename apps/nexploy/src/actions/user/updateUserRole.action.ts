'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { updateUserRoleSchema } from '@workspace/schemas-zod/user/updateUserRole.schema';

export const updateUserRole = authActionServer
    .inputSchema(updateUserRoleSchema)
    .action(async ({ parsedInput: { userId, role }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can update user roles');
        }

        if (userId === session.user.id) {
            throw new Error('You cannot change your own role');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath('/admin/users');

        return { user };
    });
