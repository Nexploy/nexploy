'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { getRegistryById, updateRegistry } from '@/services/registry.service';
import {
    deleteLocalRegistryTraefikConfig,
    hashRegistryPassword,
    readLocalRegistryConfig,
    writeLocalRegistryTraefikConfig,
} from '@/services/localRegistry.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { kyDocker } from '@/lib/api/kyDocker';
import { decrypt } from '@/lib/encryption';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

const TRAEFIK_RELOAD_ATTEMPTS = 3;
const TRAEFIK_RELOAD_DELAY_MS = 2000;

async function loginWithRetry(serveraddress: string, username: string, password: string): Promise<void> {
    for (let attempt = 1; attempt <= TRAEFIK_RELOAD_ATTEMPTS; attempt++) {
        try {
            await kyDocker.post('registries/login', { json: { serveraddress, username, password } });
            return;
        } catch (err) {
            if (attempt === TRAEFIK_RELOAD_ATTEMPTS) throw err;
            await new Promise((resolve) => setTimeout(resolve, TRAEFIK_RELOAD_DELAY_MS));
        }
    }
}

export const updateRegistryAction = authActionServer
    .metadata({ name: 'registry.update' })
    .use(requirePermission('registry', 'update'))
    .inputSchema(updateRegistrySchema)
    .action(async ({ parsedInput }) => {
        const existing = await getRegistryById(parsedInput.id);

        let passwordToLogin = parsedInput.password;
        if (!passwordToLogin) {
            passwordToLogin = existing?.password ? decrypt(existing.password) : undefined;
        }

        const usernameToLogin = parsedInput.username;

        const localConfig = existing ? await readLocalRegistryConfig(existing.url) : null;

        if (localConfig) {
            const meta = localConfig['x-nexploy-registry'];

            if (!usernameToLogin || !passwordToLogin) {
                const t = await getErrorTranslator();
                const message = t('registry.localCredentialsRequired');
                await setToastServer({ type: 'error', message });
                throw new Error(message);
            }

            await writeLocalRegistryTraefikConfig({
                containerName: meta.containerName,
                domain: parsedInput.url,
                username: usernameToLogin,
                users: [await hashRegistryPassword(usernameToLogin, passwordToLogin)],
            });

            if (meta.domain !== parsedInput.url) {
                await deleteLocalRegistryTraefikConfig(meta.domain);
            }

            await updateRegistry(parsedInput);
            revalidatePath('/registry');

            try {
                await loginWithRetry(parsedInput.url, usernameToLogin, passwordToLogin);
            } catch (err: any) {
                await setToastServer({ type: 'warning', message: err.message });
            }

            return;
        }

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
            revalidatePath('/registry');
        } catch (err: any) {
            await setToastServer({ type: 'error', message: err.message });
            throw err;
        }
    });
