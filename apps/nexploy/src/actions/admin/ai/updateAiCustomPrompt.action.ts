'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAICustomPromptSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';

export const updateAICustomPromptAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAICustomPromptSchema)
    .action(async ({ parsedInput }) => {
        await updateAISettingsPart({
            customSystemPrompt: parsedInput.customSystemPrompt.trim() || null,
        });
    });
