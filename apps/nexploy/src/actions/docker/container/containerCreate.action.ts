'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { getTranslations } from 'next-intl/server';

async function getContainerCreateFormSchema() {
    const t = await getTranslations('validation');
    return containerCreateFormSchema(t);
}

export const onContainerCreateAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(getContainerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post(`container/create`, { json: parsedInput, timeout: false })
                .json<{ id: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
