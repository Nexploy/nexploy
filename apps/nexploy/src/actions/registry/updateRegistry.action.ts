'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { getRegistryById, updateRegistry } from '@/services/registry.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { decrypt } from '@/lib/encryption';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const updateRegistryAction = authActionServer
    .use(requirePermission('registry', 'update'))
    .inputSchema(updateRegistrySchema)
    .action(async ({ parsedInput }) => {
        let passwordToLogin = parsedInput.password;
        if (!passwordToLogin) {
            const existing = await getRegistryById(parsedInput.id);
            passwordToLogin = existing?.password ? decrypt(existing.password) : undefined;
        }

        const usernameToLogin = parsedInput.username;

        try {
            if (usernameToLogin && passwordToLogin) {
                await kyDocker.post('registries/login', {
                    json: {
                        serveraddress: parsedInput.url,
                        username: usernameToLogin,
                        password: passwordToLogin,
                    },
                });
            } else {
                await kyDocker.post('registries/ping', {
                    json: { serveraddress: parsedInput.url },
                });
            }

            await updateRegistry(parsedInput);
            revalidatePath('/admin/registry');
        } catch (err: any) {
            await setToastServer({ type: 'error', message: err.message });
            throw err;
        }
    });
