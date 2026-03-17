'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { redirect } from 'next/navigation';
import { deleteRepository } from '@/services/repository.service';
import { deleteRepositorySchema } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export const deleteRepositoryAction = authActionServer
    .use(requirePermission('repository', 'delete'))
    .inputSchema(deleteRepositorySchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteRepository(parsedInput.repositoryId);
            redirect('/repositories');
        } catch (error: unknown) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
