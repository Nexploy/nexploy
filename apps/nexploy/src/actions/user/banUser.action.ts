'use server';

import { adminOnly, authActionServer, preventSelfAction } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { banUsersSchema } from '@workspace/schemas-zod/user/banUsersSchema';

export const banUser = authActionServer
    .use(adminOnly)
    .use(preventSelfAction)
    .inputSchema(banUsersSchema)
    .action(async ({ parsedInput: { userId, reason, action } }) => {
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
            throw new Error('Failed to ban/unban user');
        }
    });
