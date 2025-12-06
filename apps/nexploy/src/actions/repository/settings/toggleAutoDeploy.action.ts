'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { toggleAutoDeployRepository } from '@/services/repository.service';
import { toggleAutoDeploySchema } from '@workspace/schemas-zod/repository/settings/toggleAutoDeploy.schema';

export const toggleAutoDeployAction = authActionServer
    .inputSchema(toggleAutoDeploySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const result = await toggleAutoDeployRepository(
                parsedInput.repositoryId,
                parsedInput.autoDeploy,
                ctx.session.user.id,
            );

            revalidatePath(`/repositories/${parsedInput.repositoryId}`);
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
