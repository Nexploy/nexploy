'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { volumeActionsSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onVolumeAction = authActionServer
    .inputSchema(volumeActionsSchema)
    .action(async ({ parsedInput: { action, volumeNames } }) => {
        try {
            await drinoDocker.post(`/volumes/${action}`, { volumeNames }).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
