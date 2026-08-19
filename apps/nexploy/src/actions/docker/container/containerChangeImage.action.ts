'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerChangeImageSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';
import { getRegistryWithPassword } from '@/services/registry.service';
import { byContainerIds } from '@/lib/auth/resolveOrgContext';
import { getPortBindingHostIp } from '@/services/networkExposureSettings.service';

export const onContainerChangeImageAction = authActionServer
    .metadata({ name: 'container.changeImage' })
    .use(requirePermission('container', 'manage', byContainerIds))
    .use(requireUnprotectedEnvironment('container.update'))
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

        const hostIp = await getPortBindingHostIp();

        try {
            return await kyDocker
                .post('container/recreate', {
                    json: { containerId, image, pullImage, auth, async: true, hostIp },
                })
                .json<{ taskId: string; name: string }>();
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
