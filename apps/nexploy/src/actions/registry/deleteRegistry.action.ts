'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { revalidatePath } from 'next/cache';
import { kyDocker } from '@/lib/api/kyDocker.ts';
import { deleteRegistry, getRegistryById } from '@/services/registry.service.ts';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer.ts';

export const deleteRegistryAction = authActionServer
    .use(requirePermission('registry', 'delete'))
    .inputSchema(deleteRegistrySchema)
    .action(async ({ parsedInput }) => {
        try {
            const registry = await getRegistryById(parsedInput.id);

            await deleteRegistry(parsedInput.id);

            if (registry?.url) {
                try {
                    await kyDocker.post('registries/logout', {
                        json: { serveraddress: registry.url },
                    });
                } catch {
                    /* empty */
                }
            }

            revalidatePath('/admin/registry');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                const body = await err.response.json<{ message: string }>();
                await setToastServer({ type: 'error', message: body.message ?? err.message });
            }
            throw err;
        }
    });
