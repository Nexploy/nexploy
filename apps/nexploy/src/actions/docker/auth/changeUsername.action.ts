'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { changeUsername } from '@/services/auth/auth.service';
import { changeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';

async function getSignInFormSchema() {
    const t = await getTranslations('validation');
    return changeUsernameFormSchema(t);
}

export const onChangeUsernameAction = actionServer
    .inputSchema(getSignInFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await changeUsername(parsedInput);
        } catch (error: any) {
            if (error instanceof Error) {
                return returnValidationErrors(getSignInFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
