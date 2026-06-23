'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { runCleanupSchema } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import { runCleanupTarget } from '@/services/dockerCleanup.service';
import { setToastServer } from '@/lib/toastServer';

export const runCleanupAction = authActionServer
    .use(requirePermission('setting', 'manage'))
    .inputSchema(runCleanupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const reclaimedSpace = await runCleanupTarget(parsedInput.target);
            return { reclaimedSpace };
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
