'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { signInUser } from '@/services/auth/auth.service';
import { signInFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export const onSignInAction = actionServer
    .inputSchema(signInFormSchema)
    .action(async ({ parsedInput: { email, password } }) => {
        try {
            await signInUser(email, password);
            redirect('/repositories', RedirectType.replace);
        } catch (err: any) {
            if (isRedirectError(err)) throw err;
            if (err instanceof Error) {
                return returnValidationErrors(signInFormSchema, {
                    _errors: [err.message],
                });
            }
            throw err;
        }
    });
