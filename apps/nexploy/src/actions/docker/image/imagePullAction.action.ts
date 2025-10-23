'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { ImagePullSchema } from '@workspace/schemas-zod/image/imagePullAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onImagePullAction = actionServer
    .inputSchema(ImagePullSchema)
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
