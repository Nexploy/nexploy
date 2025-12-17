'use server';

import {
    createEnvironment,
    deleteEnvironment,
    getDefaultEnvironment,
    setDefaultEnvironment,
    updateEnvironment,
} from '@/services/environment/environment.service';
import {
    environmentIdSchema,
    environmentSchema,
} from '@workspace/schemas-zod/docker/environment/environment.schema';
import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';

export const getDefaultEnvironmentAction = authActionServer.action(async () => {
    return getDefaultEnvironment();
});

export const createEnvironmentAction = authActionServer
    .inputSchema(environmentSchema)
    .action(async ({ parsedInput, ctx }) => {
        return createEnvironment(parsedInput, ctx.session.user.id);
    });

export const updateEnvironmentAction = authActionServer
    .inputSchema(
        z.object({
            id: z.cuid(),
            data: environmentSchema,
        }),
    )
    .action(async ({ parsedInput }) => {
        return updateEnvironment(parsedInput.id, parsedInput.data);
    });

export const setDefaultEnvironmentAction = authActionServer
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        await setDefaultEnvironment(parsedInput.environmentId);
    });

export const deleteEnvironmentAction = authActionServer
    .inputSchema(environmentIdSchema)
    .action(async ({ parsedInput }) => {
        await deleteEnvironment(parsedInput.environmentId);
        return { success: true };
    });
