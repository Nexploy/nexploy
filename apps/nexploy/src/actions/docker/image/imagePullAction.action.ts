'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';

export const onImagePullAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(imagePullSchema)
    .action(async ({ parsedInput: { imageName } }) => {
        try {
            return await kyDocker.post('images/pull', { json: imageName }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
