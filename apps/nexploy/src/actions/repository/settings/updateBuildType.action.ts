'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { buildTypeSchema } from '@workspace/schemas-zod/repository/buildType.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { updateBuildTypeRepository } from '@/services/repository.service';

export const updateBuildTypeAction = authActionServer
    .inputSchema(buildTypeSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput: { buildType }, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await updateBuildTypeRepository(buildType, repositoryId);

            revalidatePath(`/repositories/${repositoryId}`);
            return buildType;
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
