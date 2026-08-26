'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import {
    LOCAL_REGISTRY_CONTAINER_DATA_PATH,
    LOCAL_REGISTRY_CONTAINER_PORT,
    LOCAL_REGISTRY_IMAGE,
    createLocalRegistrySchema,
} from '@workspace/schemas-zod/registry/registry.schema';
import { createRegistry } from '@/services/registry.service';
import { hashRegistryPassword, writeLocalRegistryTraefikConfig } from '@/services/localRegistry.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const createLocalRegistryAction = authActionServer
    .metadata({ name: 'registry.createLocal' })
    .use(requirePermission('registry', 'create'))
    .use(requirePermission('container', 'manage', HOST_SCOPED))
    .use(requireUnprotectedEnvironment('container.create'))
    .inputSchema(createLocalRegistrySchema)
    .action(async ({ parsedInput }) => {
        const { name, containerName, host, port, dataPath, secure, username, password } = parsedInput;

        try {
            await kyDocker.post('container/create', {
                timeout: false,
                json: {
                    name: containerName,
                    image: LOCAL_REGISTRY_IMAGE,
                    restart: 'unless-stopped',
                    ports: secure
                        ? []
                        : [{ hostPort: port, containerPort: LOCAL_REGISTRY_CONTAINER_PORT, protocol: 'tcp' }],
                    volumes: [
                        { hostPath: dataPath, containerPath: LOCAL_REGISTRY_CONTAINER_DATA_PATH, readOnly: false },
                    ],
                    envVars: [{ key: 'REGISTRY_STORAGE_DELETE_ENABLED', value: 'true' }],
                    networks: [],
                    labels: [],
                    autoRemove: false,
                },
            });

            if (secure) {
                await writeLocalRegistryTraefikConfig({
                    containerName,
                    domain: host,
                    username: username as string,
                    users: [await hashRegistryPassword(username as string, password as string)],
                });
            }

            const registry = await createRegistry({
                name,
                url: secure ? host : `${host}:${port}`,
                containerName,
                username: secure ? username : undefined,
                password: secure ? password : undefined,
            });

            revalidatePath('/docker/registry');

            return registry;
        } catch (err: any) {
            await setToastServer({ type: 'error', message: err.message });
            throw err;
        }
    });
