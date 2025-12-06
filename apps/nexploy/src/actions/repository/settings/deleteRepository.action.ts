'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { redirect } from 'next/navigation';
import { deleteRepository } from '@/services/repository.service';
import { deleteRepositorySchema } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';

export const deleteRepositoryAction = authActionServer
    .inputSchema(deleteRepositorySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            await deleteRepository(parsedInput.repositoryId, ctx.session.user.id);
            redirect('/repositories');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
