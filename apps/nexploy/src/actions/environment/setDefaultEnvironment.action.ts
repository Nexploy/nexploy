'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { setDefaultEnvironment } from '@/services/environment/environment.service';
import { environmentIdSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const setDefaultEnvironmentAction = authActionServer
    .use(requirePermission('environment', 'update'))
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await setDefaultEnvironment(parsedInput.environmentId);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
