'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAICustomPromptSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';
import { setToastServer } from '@/lib/toastServer';

export const updateAICustomPromptAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAICustomPromptSchema)
    .action(async ({ parsedInput }) => {
        try {
            await updateAISettingsPart({
                customSystemPrompt: parsedInput.customSystemPrompt.trim() || null,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
