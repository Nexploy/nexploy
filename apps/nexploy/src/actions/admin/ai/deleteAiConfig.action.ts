'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { providerSchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { deleteProviderApiKey } from '@/services/aiConfig.service';
import { z } from 'zod';

export const deleteAiConfigAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(z.object({ provider: providerSchema }))
    .action(async ({ parsedInput }) => {
        await deleteProviderApiKey(parsedInput.provider);
    });
