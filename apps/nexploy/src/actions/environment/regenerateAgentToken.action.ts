'use server';

import {
    authActionServer,
    fromInputField,
    requirePermission,
    requireUnprotectedEnvironment,
} from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { regenerateDockerAgentToken } from '@/services/environment/dockerAgent.service';
import { regenerateDockerAgentTokenSchema } from '@workspace/schemas-zod/docker/environment/agent.schema';

export const regenerateAgentTokenAction = authActionServer
    .metadata({ name: 'environment.regenerateAgentToken' })
    .use(requirePermission('environment', 'update'))
    .use(requireUnprotectedEnvironment('environment.update', fromInputField('environmentId')))
    .inputSchema(regenerateDockerAgentTokenSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await regenerateDockerAgentToken(parsedInput.environmentId);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
