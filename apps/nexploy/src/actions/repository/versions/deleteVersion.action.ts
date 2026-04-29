'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteVersionSchema } from '@workspace/schemas-zod/repository/version.schema';
import { deleteVersion } from '@/services/docker/version.service';
import { setToastServer } from '@/lib/toastServer.ts';
import { revalidatePath } from 'next/cache';

export const onDeleteVersion = authActionServer
    .use(requirePermission('build', 'delete'))
    .inputSchema(deleteVersionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { repositoryId, imageTag } = parsedInput;
            await deleteVersion(repositoryId, imageTag);

            revalidatePath('/repositories', 'page');
        } catch (error) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
