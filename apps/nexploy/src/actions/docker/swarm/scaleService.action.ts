'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { scaleServiceFormSchema } from '@workspace/schemas-zod/docker/swarm/serviceAction.schema';
import { getTranslations } from 'next-intl/server';

async function getScaleServiceFormSchema() {
    const t = await getTranslations('validation');
    return scaleServiceFormSchema(t);
}

export const onScaleServiceAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(getScaleServiceFormSchema)
    .action(async ({ parsedInput: { id, replicas } }) => {
        try {
            return await kyDocker
                .post(`swarm/services/${id}/scale`, { json: { replicas } })
                .json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
