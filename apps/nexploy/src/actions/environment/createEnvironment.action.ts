'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { createEnvironment } from '@/services/environment/environment.service';
import { environmentSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const createEnvironmentAction = authActionServer
    .use(requirePermission('environment', 'create'))
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            return await createEnvironment(parsedInput, ctx.session.user.id);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
