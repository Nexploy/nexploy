'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { volumeActionsSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onVolumeAction = authActionServer
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
