'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAIChatBehaviorSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';

export const updateAIChatBehaviorAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAIChatBehaviorSchema)
    .action(async ({ parsedInput }) => {
        await updateAISettingsPart(parsedInput);
    });
