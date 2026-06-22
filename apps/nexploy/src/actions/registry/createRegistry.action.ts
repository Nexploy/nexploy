'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { createRegistry } from '@/services/registry.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const createRegistryAction = authActionServer
    .use(requirePermission('registry', 'create'))
    .inputSchema(createRegistrySchema)
    .action(async ({ parsedInput }) => {
        try {
            if (parsedInput.username && parsedInput.password) {
                await kyDocker.post('registries/login', {
                    json: {
                        serveraddress: parsedInput.url,
                        username: parsedInput.username,
                        password: parsedInput.password,
                    },
                });
            } else {
                await kyDocker.post('registries/ping', {
                    json: { serveraddress: parsedInput.url },
                });
            }

            await createRegistry(parsedInput);
            revalidatePath('/admin/registry');
        } catch (err: any) {
            await setToastServer({ type: 'error', message: err.message });
            throw err;
        }
    });
