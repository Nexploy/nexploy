'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { SetupFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';
import { setupAdminAccount } from '@/services/auth/setup.auth.service';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

async function GetSetupFormSchema() {
    const t = await getTranslations('validation');
    return SetupFormSchema(t);
}

export const onSetupAction = actionServer
    .inputSchema(GetSetupFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await setupAdminAccount(parsedInput);
            redirect('/', RedirectType.replace);
        } catch (error: any) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                return returnValidationErrors(GetSetupFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
