'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { setupRepositoryWebhook } from '@/services/webhook/repoWebhook.service';
import { setupWebhookSchema } from '@workspace/schemas-zod/repository/setupWebhook.schema';
import { setToastServer } from '@/lib/toastServer.ts';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const setupWebhookAction = authActionServer
    .metadata({ name: 'pipeline.setupWebhook' })
    .use(requirePermission('pipeline', 'webhook', byRepositoryId))
    .inputSchema(setupWebhookSchema)
    .action(async ({ parsedInput }) => {
        try {
            const baseUrl = await getBaseUrl();
            return await setupRepositoryWebhook(parsedInput.repositoryId, baseUrl, {
                refresh: parsedInput.refresh,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
