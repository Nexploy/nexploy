'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { providerSchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { deleteProviderApiKey } from '@/services/aiConfig.service';
import { setToastServer } from '@/lib/toastServer';
import { z } from 'zod';

export const deleteAiConfigAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(z.object({ provider: providerSchema }))
    .action(async ({ parsedInput }) => {
        try {
            await deleteProviderApiKey(parsedInput.provider);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
