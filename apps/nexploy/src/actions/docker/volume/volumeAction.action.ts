'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { volumeActionsSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/lib/toastServer';

export const onVolumeAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(volumeActionsSchema)
    .action(async ({ parsedInput: { action, volumeNames } }) => {
        try {
            return await kyDocker.post(`volumes/${action}`, { json: { volumeNames } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
