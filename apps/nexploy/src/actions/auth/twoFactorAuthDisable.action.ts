'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { disable2FA } from '@/services/auth/twoFactorAuth.service';
import { twoFactorAuthSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { setToastServer } from '@/lib/toastServer';

export const onTwoFactorAuthDisableAction = authActionServer
    .inputSchema(twoFactorAuthSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await disable2FA(parsedInput);
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
