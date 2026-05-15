'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { updateEnvironment } from '@/services/environment/environment.service';
import { environmentSchema } from '@workspace/schemas-zod/docker/environment/environment.schema';
import { getTranslations } from 'next-intl/server';

async function getEnvironmentSchema() {
    const t = await getTranslations('validation');
    return environmentSchema(t);
}

export const updateEnvironmentAction = authActionServer
    .use(requirePermission('environment', 'update'))
    .inputSchema(getEnvironmentSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await updateEnvironment(parsedInput);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
                throw error;
            }
        }
    });
