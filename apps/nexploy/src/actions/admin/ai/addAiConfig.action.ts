'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { addProviderApiKeySchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { addProviderApiKey } from '@/services/aiConfig.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const addAiConfigAction = authActionServer
    .inputSchema(addProviderApiKeySchema)
    .action(async ({ parsedInput }) => {
        try {
            return await addProviderApiKey(parsedInput.provider, parsedInput.apiKey);
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
