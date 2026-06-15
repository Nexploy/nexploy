'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteAiConfigSchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { deleteProviderApiKey } from '@/services/aiConfig.service';
import { setToastServer } from '@/lib/toastServer';

export const deleteAiConfigAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(deleteAiConfigSchema)
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
