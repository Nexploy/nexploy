'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAIMcpPermissionsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';

export const updateAIMcpPermissionsAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAIMcpPermissionsSchema)
    .action(async ({ parsedInput }) => {
        await updateAISettingsPart(parsedInput);
    });
