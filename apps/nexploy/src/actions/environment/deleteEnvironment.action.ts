'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deleteEnvironment } from '@/services/environment/environment.service';
import { environmentIdSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const deleteEnvironmentAction = authActionServer
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await deleteEnvironment(parsedInput.environmentId);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
