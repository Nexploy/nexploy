'use server';

import { actionServer } from '@/lib/api/safe-action';
import { returnValidationErrors } from 'next-safe-action';
import { setupFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { getTranslations } from 'next-intl/server';
import { setupAdminAccount } from '@/services/auth/setup.auth.service';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

async function getSetupFormSchema() {
    const t = await getTranslations('validation');
    return setupFormSchema(t);
}

export const onSetupAction = actionServer
    .inputSchema(getSetupFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await setupAdminAccount(parsedInput);
            redirect('/', RedirectType.replace);
        } catch (error: any) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                return returnValidationErrors(getSetupFormSchema, {
                    _errors: [error.message],
                });
            }
        }
    });
