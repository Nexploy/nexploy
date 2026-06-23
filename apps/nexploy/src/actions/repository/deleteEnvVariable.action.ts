'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvVariables } from '@/services/repository.service';
import { z } from 'zod';

export const deleteEnvVariableAction = authActionServer
    .use(requirePermission('envVar', 'write'))
    .inputSchema(z.object({ repositoryId: z.string(), envVariableId: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const { repositoryId, envVariableId } = parsedInput;

        try {
            await updateEnvVariables(repositoryId, ctx.session.user.id, {
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
