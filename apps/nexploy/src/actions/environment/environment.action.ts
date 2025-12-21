'use server';

import {
    checkAllEnvironmentsHealth,
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

export const getDefaultEnvironmentAction = authActionServer.action(async () => {
    return getDefaultEnvironment();
});

export const getUserEnvironmentsAction = authActionServer.action(async () => {
    return getUserEnvironments();
});

export const createEnvironmentAction = authActionServer
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput, ctx }) => {
        return await createEnvironment(parsedInput, ctx.session.user.id);
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
