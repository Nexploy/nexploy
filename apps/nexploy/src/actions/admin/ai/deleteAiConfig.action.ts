'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { providerSchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { deleteProviderApiKey } from '@/services/aiConfig.service';
import { z } from 'zod';

export const deleteAiConfigAction = authActionServer
    .inputSchema(z.object({ provider: providerSchema }))
    .action(async ({ parsedInput }) => {
        await deleteProviderApiKey(parsedInput.provider);
    });
