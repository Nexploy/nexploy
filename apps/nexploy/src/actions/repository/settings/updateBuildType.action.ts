'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { buildTypeSchema } from '@workspace/schemas-zod/repository/buildType.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { updateBuildTypeRepository } from '@/services/repository.service';

export const updateBuildTypeAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(buildTypeSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await updateBuildTypeRepository(parsedInput, repositoryId);

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
