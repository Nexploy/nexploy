'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { signInUser } from '@/services/auth/auth.service';
import { signInFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

async function getSignInFormSchema() {
    const t = await getTranslations('validation');
    return signInFormSchema(t);
}

export const onSignInAction = actionServer
    .inputSchema(getSignInFormSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        try {
            await signInUser(email, password);
            redirect('/repositories', RedirectType.replace);
        } catch (error: any) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                return returnValidationErrors(getSignInFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
