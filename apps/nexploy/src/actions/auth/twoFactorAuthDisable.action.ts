'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { disable2FA } from '@/services/auth/twoFactorAuth.service';
import { twoFactorAuthSchema } from '@workspace/schemas-zod/auth/twoFactorAuth.schema';
import { getTranslations } from 'next-intl/server';
import { setToastServer } from '@/lib/toastServer';

async function getTwoFactorAuthDisableSchema() {
    const t = await getTranslations('validation');
    return twoFactorAuthSchema(t);
}

export const onTwoFactorAuthDisableAction = authActionServer
    .inputSchema(getTwoFactorAuthDisableSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await disable2FA(parsedInput);
        } catch (error: any) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
