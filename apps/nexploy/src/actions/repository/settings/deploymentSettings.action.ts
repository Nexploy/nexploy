'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { updateDeploymentSettings } from '@/services/repository.service';
import { deploymentSettingsSchema } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';

export const deploymentSettingsAction = authActionServer
    .inputSchema(deploymentSettingsSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { repositoryId, ...settings } = parsedInput;

            const result = await updateDeploymentSettings(
                repositoryId,
                settings,
                ctx.session.user.id,
            );

            revalidatePath(`/repositories/${repositoryId}`);
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
