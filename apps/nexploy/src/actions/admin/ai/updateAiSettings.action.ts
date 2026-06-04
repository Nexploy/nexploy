'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAISettingsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateRequireDestructiveConfirmation } from '@/services/aiSettings.service';

export const updateAISettingsAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAISettingsSchema)
    .action(async ({ parsedInput }) => {
        await updateRequireDestructiveConfirmation(parsedInput.requireDestructiveConfirmation);
    });
