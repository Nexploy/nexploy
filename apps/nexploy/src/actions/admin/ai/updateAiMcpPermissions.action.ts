'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateAIMcpPermissionsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAISettingsPart } from '@/services/aiSettings.service';
import { setToastServer } from '@/lib/toastServer';

export const updateAIMcpPermissionsAction = authActionServer
    .use(requirePermission('ai', 'manage'))
    .inputSchema(updateAIMcpPermissionsSchema)
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
