'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { HTTPError } from 'ky';
import { getTranslations } from 'next-intl/server';

async function getNetworkCreateSchema() {
    const t = await getTranslations('validation');
    return networkCreateSchema(t);
}

export const onNetworkCreateAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(getNetworkCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await kyDocker.post('networks/create', { json: parsedInput }).json();

            const t = await getTranslations('docker');
            await setToastServer({
                type: 'success',
                message: t('networkCreatedSuccess'),
            });

            return response;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
