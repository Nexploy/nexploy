'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageTagSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';

export const onImageTagAction = authActionServer
    .metadata({ name: 'image.tag' })
    .use(requirePermission('image', 'manage'))
    .use(requireUnprotectedEnvironment('image.manage'))
    .inputSchema(imageTagSchema)
    .action(async ({ parsedInput: { imageId, repo, tag } }) => {
        try {
            return await kyDocker.post('images/tag', { json: { imageId, repo, tag } }).json<{ ok: true }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
