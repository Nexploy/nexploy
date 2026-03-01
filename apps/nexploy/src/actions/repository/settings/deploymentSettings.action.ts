'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { updateDeploymentSettings } from '@/services/repository.service';
import { deploymentSettingsSchema } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';

export const deploymentSettingsAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(deploymentSettingsSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { repositoryId, ...settings } = parsedInput;

            await updateDeploymentSettings(repositoryId, settings, ctx.session.user.id);

            revalidatePath(`/repositories/${repositoryId}`);
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
