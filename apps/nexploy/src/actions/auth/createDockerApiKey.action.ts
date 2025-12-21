import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';

const createDockerApiKeySchema = z.object({
    userId: z.string(),
});

export const createDockerApiKeyAction = authActionServer.action(async ({ ctx }) => {
    try {
        // Create API key for docker-api with no expiration
        const apiKey = await auth.api.createApiKey({
            body: {
                name: 'docker-api-internal-key',
                userId: ctx.session.user.id,
                prefix: 'docker-api',
                // No expiration for internal service
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
        throw new Error('Failed to create API key');
    }
});
