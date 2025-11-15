'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { volumeActionsSchema } from '@workspace/schemas-zod/volume/volumeAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onVolumeAction = actionServer
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
