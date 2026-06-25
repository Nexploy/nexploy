'use server';

import { actionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { setupFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { setupAdminAccount } from '@/services/auth/setup.auth.service';
import { redirect, RedirectType } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export const onSetupAction = actionServer
    .inputSchema(setupFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await setupAdminAccount(parsedInput);
            redirect('/', RedirectType.replace);
        } catch (err: any) {
            if (isRedirectError(err)) throw err;
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
