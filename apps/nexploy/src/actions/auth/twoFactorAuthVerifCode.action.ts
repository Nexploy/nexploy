'use server';

import { actionServer } from '@/lib/api/safe-action';
import { verifCode } from '@/services/auth/twoFactorAuth.service';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { setToastServer } from '@/lib/toastServer';

export const twoFactorAuthVerifCodeAction = actionServer
    .inputSchema(twoFactorAuthCodeSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await verifCode(parsedInput);
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
