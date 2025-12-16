'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { createUserFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';
import { createUser } from '@/services/auth/createUser.service';
import { revalidatePath } from 'next/cache';

async function getCreateUserFormSchema() {
    const t = await getTranslations('validation');
    return createUserFormSchema(t);
}

export const onCreateUserAction = actionServer
    .inputSchema(getCreateUserFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            const user = await createUser(parsedInput);
            revalidatePath('/admin/users');

            return user;
        } catch (error: any) {
            if (error instanceof Error) {
                return returnValidationErrors(getCreateUserFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
