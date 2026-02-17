'use server';

import { actionServer } from '@/lib/api/safe-action';
import { verifCode } from '@/services/auth/twoFactorAuth.service';
import { getTranslations } from 'next-intl/server';
import { twoFactorAuthCodeSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { setToastServer } from '@/lib/toastServer';

async function getTwoFactorAuthVerifTotpSchema() {
    const t = await getTranslations('validation');
    return twoFactorAuthCodeSchema(t);
}

export const twoFactorAuthVerifCodeAction = actionServer
    .inputSchema(getTwoFactorAuthVerifTotpSchema)
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
