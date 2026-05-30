'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { upsertProviderApiKeySchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { upsertProviderApiKey } from '@/services/aiConfig.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const updateAiConfigAction = authActionServer
    .inputSchema(upsertProviderApiKeySchema)
    .action(async ({ parsedInput }) => {
        try {
            return await upsertProviderApiKey(parsedInput.provider, parsedInput.apiKey);
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
