'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateCleanupSettingsSchema } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import {
    getCurrentEnvironmentKey,
    updateCleanupSettings,
} from '@/services/cleanupSettings.service';
import { setToastServer } from '@/lib/toastServer';
import { inngest } from '@/inngest/client';
import { CLEANUP_SCHEDULE_EVENT } from '@/inngest/functions/dockerCleanupScheduler';

export const updateCleanupSettingsAction = authActionServer
    .use(requirePermission('docker', 'prune'))
    .inputSchema(updateCleanupSettingsSchema)
    .action(async ({ parsedInput }) => {
        try {
            const environmentId = await getCurrentEnvironmentKey();
            await updateCleanupSettings(parsedInput, environmentId);

            await inngest.send({ name: CLEANUP_SCHEDULE_EVENT, data: { environmentId } });

            revalidatePath('/admin/settings');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
