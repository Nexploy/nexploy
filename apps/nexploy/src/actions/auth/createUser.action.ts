'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
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
        } catch (error: any) {
            if (error instanceof Error) {
                return returnValidationErrors(createUserFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
