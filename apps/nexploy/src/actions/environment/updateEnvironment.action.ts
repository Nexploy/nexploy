'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvironment } from '@/services/environment/environment.service';
import { environmentSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const updateEnvironmentAction = authActionServer
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await updateEnvironment(parsedInput);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
