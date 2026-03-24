'use server';

import { z } from 'zod';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { teardownRepositoryWebhook } from '@/services/webhook/repoWebhook.service';

export const teardownWebhookAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(z.object({ repositoryId: z.cuid() }))
    .action(async ({ parsedInput }) => {
        await teardownRepositoryWebhook(parsedInput.repositoryId);
    });
