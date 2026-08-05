'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvVariables } from '@/services/repository.service';
import { deleteEnvVariableSchema } from '@workspace/schemas-zod/repository/deleteEnvVariable.schema';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const deleteEnvVariableAction = authActionServer
    .metadata({ name: 'repository.deleteEnvVariable' })
    .use(requirePermission('envVar', 'write', byRepositoryId))
    .inputSchema(deleteEnvVariableSchema)
    .action(async ({ parsedInput }) => {
        const { repositoryId, envVariableId } = parsedInput;

        try {
            await updateEnvVariables(repositoryId, {
                updates: [],
                creates: [],
                deleteIds: [envVariableId],
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
