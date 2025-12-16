'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onImagePullAction = authActionServer
    .inputSchema(imagePullSchema)
    .action(async ({ parsedInput: { imageName } }) => {
        try {
            return await kyDocker.post('images/pull', { json: imageName }).json();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
