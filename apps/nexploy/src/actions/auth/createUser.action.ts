'use server';

import { actionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { createUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { createUser } from '@/services/auth/createUser.service';
import { revalidatePath } from 'next/cache';

export const onCreateUserAction = actionServer
    .inputSchema(createUserFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            const user = await createUser(parsedInput);
            revalidatePath('/admin/users');

            return user;
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
