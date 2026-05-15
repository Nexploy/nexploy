'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvVariables } from '@/services/repository.service';
import { envVariableSchema } from '@workspace/schemas-zod/repository/envVariable.schema';
import { getTranslations } from 'next-intl/server';

async function getEnvVariableSchema() {
    const t = await getTranslations('validation');
    return envVariableSchema(t);
}

export const onEnvVariableAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(getEnvVariableSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { repositoryId, envVariables, deleteIds } = parsedInput;

        try {
            const updates = envVariables
                .filter((env) => env.id && !deleteIds.includes(env.id))
                .map((env) => ({
                    id: env.id!,
                    key: env.key,
                    value: env.value,
                }));

            const creates = envVariables
                .filter((env) => !env.id)
                .map((env) => ({
                    key: env.key,
                    value: env.value,
                }));

            const result = await updateEnvVariables(repositoryId, ctx.session.user.id, {
                updates,
                creates,
                deleteIds,
            });

            return result;
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
