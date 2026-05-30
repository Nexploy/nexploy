'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { setDefaultEnvironmentById } from '@/services/environment/environment.service';
import { environmentIdSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const setDefaultEnvironmentAction = authActionServer
    .use(requirePermission('environment', 'update'))
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await setDefaultEnvironmentById(parsedInput.environmentId);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
