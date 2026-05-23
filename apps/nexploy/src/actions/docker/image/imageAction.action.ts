'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageActionsSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { HTTPError } from 'ky';
import { ImageDeleteResponse } from '@workspace/typescript-interface/docker/docker.image';
import { setToastServer } from '@/lib/toastServer.ts';

export const onImageAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(imageActionsSchema)
    .action(async ({ parsedInput: { action, imageIds, force } }) => {
        try {
            return await kyDocker
                .post(`images/${action}`, { json: { imageIds, force } })
                .json<ImageDeleteResponse>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
