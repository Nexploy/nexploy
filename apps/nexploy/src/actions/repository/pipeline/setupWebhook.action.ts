'use server';

import { headers } from 'next/headers';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setupRepositoryWebhook } from '@/services/webhook/repoWebhook.service';
import { setupWebhookSchema } from '@workspace/schemas-zod/repository/setupWebhook.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const setupWebhookAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(setupWebhookSchema)
    .action(async ({ parsedInput }) => {
        try {
            const headersList = await headers();
            const host = headersList.get('host') ?? '';
            const proto = headersList.get('x-forwarded-proto') ?? 'https';
            const baseUrl = `${proto}://${host}`;
            return await setupRepositoryWebhook(parsedInput.repositoryId, baseUrl);
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
