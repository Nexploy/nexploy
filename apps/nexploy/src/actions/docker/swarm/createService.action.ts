'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { createServiceFormSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { getTranslations } from 'next-intl/server';

async function getCreateServiceFormSchema() {
    const t = await getTranslations('validation');
    return createServiceFormSchema(t);
}

export const onCreateServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(getCreateServiceFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post('swarm/services', { json: parsedInput })
                .json<{ id: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
