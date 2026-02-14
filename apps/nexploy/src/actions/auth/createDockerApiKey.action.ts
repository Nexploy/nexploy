import { auth } from '@/lib/auth/auth';
import { authActionServer } from '@/lib/api/safe-action';
import { getTranslations } from 'next-intl/server';

export const createDockerApiKeyAction = authActionServer.action(async ({ ctx }) => {
    try {
        const apiKey = await auth.api.createApiKey({
            body: {
                name: 'docker-api-internal-key',
                userId: ctx.session.user.id,
                prefix: 'docker-api',

                expiresIn: undefined,
                metadata: {
                    service: 'docker-api',
                    internal: true,
                },
            },
        });

        return {
            success: true,
            apiKey: apiKey.key,
            keyId: apiKey.id,
        };
    } catch (error) {
        const t = await getTranslations('account');
        throw new Error(t('errors.failedToCreateApiKey'));
    }
});
