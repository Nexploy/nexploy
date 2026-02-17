'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { enable2FA } from '@/services/auth/twoFactorAuth.service';
import { twoFactorAuthSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { getTranslations } from 'next-intl/server';
import { setToastServer } from '@/lib/toastServer';

async function getTwoFactorAuthEnableSchema() {
    const t = await getTranslations('validation');
    return twoFactorAuthSchema(t);
}

export const onTwoFactorAuthEnableAction = authActionServer
    .inputSchema(getTwoFactorAuthEnableSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await enable2FA(parsedInput);
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
        }
    });
