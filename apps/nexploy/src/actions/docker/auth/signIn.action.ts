'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { signInUser } from '@/services/auth/auth.service';
import { SignInFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

async function GetSignInFormSchema() {
    const t = await getTranslations();
    return SignInFormSchema(t);
}

export const onSignInAction = actionServer
    .inputSchema(GetSignInFormSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        try {
            await signInUser(email, password);
            redirect('/', RedirectType.replace);
        } catch (error: any) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                return returnValidationErrors(GetSignInFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
