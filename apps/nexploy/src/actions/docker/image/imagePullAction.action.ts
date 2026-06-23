'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getRegistryWithPassword } from '@/services/registry.service';

export const onImagePullAction = authActionServer
    .use(requirePermission('image', 'pull'))
    .inputSchema(imagePullSchema)
    .action(async ({ parsedInput: { imageName, registryId } }) => {
        let auth: { username: string; password: string; serveraddress: string } | undefined;

        if (registryId && registryId !== 'none') {
            const registry = await getRegistryWithPassword(registryId);
            if (registry?.username && registry.password) {
                auth = {
                    username: registry.username,
                    password: registry.password,
                    serveraddress: registry.url,
                };
            }
        }

        try {
            return await kyDocker
                .post('images/pull', { json: { imageName, auth }, timeout: false })
                .json<{ imageName: string; imageId: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
