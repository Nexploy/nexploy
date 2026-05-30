'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { changeUsername } from '@/services/auth/auth.service';
import { changeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';

export const onChangeUsernameAction = actionServer
    .inputSchema(changeUsernameFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await changeUsername(parsedInput);
        } catch (err: any) {
            if (err instanceof Error) {
                return returnValidationErrors(changeUsernameFormSchema, {
                    _errors: [err.message],
                });
            }
            throw err;
        }
    });
