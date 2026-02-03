'use server';

import { adminOnly, authActionServer, preventSelfAction } from '@/lib/api/safe-action';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { banUsersSchema } from '@workspace/schemas-zod/user/banUsersSchema';
import { getTranslations } from 'next-intl/server';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const banUser = authActionServer
    .use(adminOnly)
    .use(preventSelfAction)
    .inputSchema(banUsersSchema)
    .action(async ({ parsedInput: { userId, reason, action } }) => {
        const tAdmin = await getTranslations('admin');

        const apiMethod = action === 'ban' ? auth.api.banUser : auth.api.unbanUser;

        await apiMethod({
            body: {
                userId,
                ...(action === 'ban' && reason && { banReason: reason }),
            },
            headers: await headers(),
        });

        revalidatePath('/admin/users');

        await setToastServer({
            type: 'success',
            message: action === 'ban' ? tAdmin('userBannedSuccess') : tAdmin('userUnbannedSuccess'),
        });
    });
