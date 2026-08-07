'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imagePushSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getRegistryWithPassword } from '@/services/registry.service';

export const onImagePushAction = authActionServer
    .metadata({ name: 'image.push' })
    .use(requirePermission('image', 'manage'))
    .use(requireUnprotectedEnvironment('image.manage'))
    .inputSchema(imagePushSchema)
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
                .post('images/push', { json: { imageName, auth } })
                .json<{ taskId: string; name: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
