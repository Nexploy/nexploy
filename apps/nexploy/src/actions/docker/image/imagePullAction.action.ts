'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onImagePullAction = authActionServer
    .inputSchema(imagePullSchema)
    .action(async ({ parsedInput: { imageName } }) => {
        try {
            await drinoDocker.post(`/images/pull`, { imageName }).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
