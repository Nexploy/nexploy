'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { networkExposureSettingsSchema } from '@workspace/schemas-zod/docker/system/networkExposure.schema';
import { updateNetworkExposureSettings } from '@/services/networkExposureSettings.service';
import { setToastServer } from '@/lib/toastServer';

export const updateNetworkExposureSettingsAction = authActionServer
    .metadata({ name: 'networkExposure.updateSettings' })
    .use(requirePermission('setting', 'manage'))
    .inputSchema(networkExposureSettingsSchema)
    .action(async ({ parsedInput }) => {
        try {
            await updateNetworkExposureSettings(parsedInput);

            revalidatePath('/admin/settings');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
