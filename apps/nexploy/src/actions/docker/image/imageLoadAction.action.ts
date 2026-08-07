'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageLoadSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import type { ImageLoadResponse } from '@workspace/typescript-interface/docker/docker.image';

export const onImageLoadAction = authActionServer
    .metadata({ name: 'image.load' })
    .use(requirePermission('image', 'pull'))
    .use(requireUnprotectedEnvironment('image.pull'))
    .inputSchema(imageLoadSchema)
    .action(async ({ parsedInput: { archive } }) => {
        try {
            return await kyDocker
                .post('images/load', {
                    body: archive,
                    headers: { 'Content-Type': 'application/x-tar' },
                })
                .json<ImageLoadResponse>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
