'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { saveEnvVariables } from '@/services/repository/envVariable.service';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';
import { revalidatePath } from 'next/cache';

export const onEnvVariableAction = authActionServer
    .metadata({ name: 'repository.updateEnvVariables' })
    .use(requirePermission('envVar', 'write', byRepositoryId))
    .inputSchema(envVariableSchema)
    .action(async ({ parsedInput }) => {
        try {
            await saveEnvVariables(parsedInput);
            revalidatePath('/repositories/[repositoryId]', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
