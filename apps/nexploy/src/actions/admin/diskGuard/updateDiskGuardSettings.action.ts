'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { diskGuardSettingsSchema } from '@workspace/schemas-zod/docker/system/diskGuard.schema';
import { updateDiskGuardSettings } from '@/services/diskGuardSettings.service';
import { setToastServer } from '@/lib/toastServer';

export const updateDiskGuardSettingsAction = authActionServer
    .metadata({ name: 'diskGuard.updateSettings' })
    .use(requirePermission('setting', 'manage'))
    .inputSchema(diskGuardSettingsSchema)
    .action(async ({ parsedInput }) => {
        try {
            await updateDiskGuardSettings(parsedInput);

            revalidatePath('/admin/settings');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
