'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { updateDeploymentSchema } from '@workspace/schemas-zod/repository/settings/updateDeployment.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { updateDeploymentRepository } from '@/services/repository.service';

export const updateDeploymentAction = authActionServer
    .inputSchema(updateDeploymentSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await updateDeploymentRepository(parsedInput, repositoryId);

            revalidatePath(`/repositories/${repositoryId}`);
            return parsedInput;
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
