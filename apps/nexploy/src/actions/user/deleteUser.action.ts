'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { deleteUserSchema } from '@workspace/schemas-zod/user/deleteUser.schema';

export const deleteUser = authActionServer
    .inputSchema(deleteUserSchema)
    .action(async ({ parsedInput: { userId }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can delete users');
        }

        if (userId === session.user.id) {
            throw new Error('You cannot delete your own account');
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/users');

        return { success: true };
    });
