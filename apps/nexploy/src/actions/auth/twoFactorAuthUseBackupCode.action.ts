'use server';

import { actionServer } from '@/lib/api/safe-action';
import { useBackupCode } from '@/services/auth/twoFactorAuth.service';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { setToastServer } from '@/lib/toastServer';

export const twoFactorAuthUseBackupCodeAction = actionServer
    .inputSchema(twoFactorAuthCodeSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await useBackupCode(parsedInput);
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
        }
    });
