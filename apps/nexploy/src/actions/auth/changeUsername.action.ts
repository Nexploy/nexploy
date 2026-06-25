'use server';

import { actionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { changeUsername } from '@/services/auth/auth.service';
import { changeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';

export const onChangeUsernameAction = actionServer
    .inputSchema(changeUsernameFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await changeUsername(parsedInput);
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
