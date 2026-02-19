'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { updateEnvironmentSchema } from '@workspace/schemas-zod/repository/settings/updateEnvironment.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvironmentRepository } from '@/services/repository.service';

export const updateEnvironmentAction = authActionServer
    .inputSchema(updateEnvironmentSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput: { environmentId }, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            const repository = await updateEnvironmentRepository(environmentId, repositoryId);

            revalidatePath(`/repositories/${repositoryId}`);
            return {
                environmentId: repository.environmentId,
                environmentName: repository.environment?.name,
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
