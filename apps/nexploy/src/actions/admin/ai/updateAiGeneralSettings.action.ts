'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAIGeneralSettingsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';

export const updateAIGeneralSettingsAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAIGeneralSettingsSchema)
    .action(async ({ parsedInput }) => {
        await updateAISettingsPart(parsedInput);
    });
