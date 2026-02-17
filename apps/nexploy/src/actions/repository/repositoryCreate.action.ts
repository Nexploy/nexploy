'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { repositoryCreateFormSchema } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { setToastServer } from '@/lib/toastServer';
import { createRepository } from '@/services/repository.service';

export const onRepositoryCreateAction = authActionServer
    .inputSchema(repositoryCreateFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            return await createRepository(parsedInput, ctx);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
