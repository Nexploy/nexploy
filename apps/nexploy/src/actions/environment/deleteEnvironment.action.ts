'use server';

import {
    authActionServer,
    requirePermission,
    requireUnprotectedEnvironment,
    fromInputField,
} from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deleteEnvironment } from '@/services/environment/environment.service';
import { environmentIdSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const deleteEnvironmentAction = authActionServer
    .metadata({ name: 'environment.delete' })
    .use(requirePermission('environment', 'delete'))
    .use(requireUnprotectedEnvironment('environment.delete', fromInputField('environmentId')))
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await deleteEnvironment(parsedInput.environmentId);
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
