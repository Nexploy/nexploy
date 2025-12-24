'use server';

import {
    createEnvironment,
    deleteEnvironment,
    getDefaultEnvironment,
    getUserEnvironments,
    setDefaultEnvironment,
    updateEnvironment,
} from '@/services/environment/environment.service';
import {
    environmentIdSchema,
    environmentSchema,
} from '@workspace/schemas-zod/docker/environment/environment.schema';
import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const getDefaultEnvironmentAction = authActionServer.action(async () => {
    return getDefaultEnvironment();
});

export const getUserEnvironmentsAction = authActionServer.action(async () => {
    return getUserEnvironments();
});

export const createEnvironmentAction = authActionServer
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            return await createEnvironment(parsedInput, ctx.session.user.id);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });

export const updateEnvironmentAction = authActionServer
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput }) => {
        return updateEnvironment(parsedInput);
    });

export const setDefaultEnvironmentAction = authActionServer
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        return setDefaultEnvironment(parsedInput.environmentId);
    });

export const deleteEnvironmentAction = authActionServer
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        return deleteEnvironment(parsedInput.environmentId);
    });
