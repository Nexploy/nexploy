'use server';

import { actionServer } from '@/lib/api/safe-action';
import { useBackupCode } from '@/services/auth/twoFactorAuth.service';
import { getTranslations } from 'next-intl/server';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

async function getTwoFactorAuthUseBackupCode() {
    const t = await getTranslations('validation');
    return twoFactorAuthCodeSchema(t);
}

export const twoFactorAuthUseBackupCodeAction = actionServer
    .inputSchema(getTwoFactorAuthUseBackupCode)
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
