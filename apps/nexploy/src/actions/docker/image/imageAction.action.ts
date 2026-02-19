'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageActionsSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';

export const onImageAction = authActionServer
    .inputSchema(imageActionsSchema)
    .action(async ({ parsedInput: { action, imageIds } }) => {
        try {
            return await kyDocker.post(`images/${action}`, { json: { imageIds } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
