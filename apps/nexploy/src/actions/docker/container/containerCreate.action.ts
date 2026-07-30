'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import { HTTPError } from 'ky';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { setToastServer } from '@/lib/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { getRegistryWithPassword } from '@/services/registry.service';

export const onContainerCreateAction = authActionServer
    .use(requirePermission('container', 'manage', HOST_SCOPED))
    .inputSchema(containerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        const { registryId, ...createInput } = parsedInput;

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
                .post(`container/create`, { json: { ...createInput, auth }, timeout: false })
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
