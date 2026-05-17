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
        } catch (error: any) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
