'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAIChatBehaviorSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';
import { setToastServer } from '@/lib/toastServer';

export const updateAIChatBehaviorAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAIChatBehaviorSchema)
    .action(async ({ parsedInput }) => {
        try {
            await updateAISettingsPart(parsedInput);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
