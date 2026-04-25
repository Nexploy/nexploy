'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { teardownRepositoryWebhook } from '@/services/webhook/repoWebhook.service';
import { teardownWebhookSchema } from '@workspace/schemas-zod/repository/teardownWebhook.schema';

export const teardownWebhookAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(teardownWebhookSchema)
    .action(async ({ parsedInput }) => {
        await teardownRepositoryWebhook(parsedInput.repositoryId);
    });
