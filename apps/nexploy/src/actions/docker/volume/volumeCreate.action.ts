'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';

export const onVolumeCreateAction = authActionServer
    .use(requirePermission('volume', 'manage'))
    .inputSchema(volumeCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await kyDocker.post('volumes/create', { json: parsedInput }).json();

            const t = await getTranslations('docker');
            await setToastServer({
                type: 'success',
                message: t('volumeCreatedSuccess'),
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
