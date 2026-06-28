'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { addProviderApiKeySchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import { addProviderApiKey } from '@/services/aiConfig.service';
import { setToastServer } from '@/lib/toastServer.ts';
import { revalidatePath } from 'next/cache';

export const addAiConfigAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(addProviderApiKeySchema)
    .action(async ({ parsedInput }) => {
        try {
            await addProviderApiKey(parsedInput.provider, parsedInput.apiKey);
            revalidatePath('/admin/ai/models');
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
