'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerChangeImageSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { getRegistryWithPassword } from '@/services/registry.service';

export const onContainerChangeImageAction = authActionServer
    .use(requirePermission('container', 'manage'))
    .inputSchema(containerChangeImageSchema)
    .action(async ({ parsedInput: { containerId, image, registryId, pullImage } }) => {
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
                .post('container/recreate', {
                    json: { containerId, image, pullImage, auth },
                    timeout: false,
                })
                .json<{ id: string }>();
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
