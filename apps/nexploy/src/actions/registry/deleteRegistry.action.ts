'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { revalidatePath } from 'next/cache';

export const deleteRegistryAction = authActionServer
    .use(requirePermission('registry', 'delete'))
    .inputSchema(deleteRegistrySchema)
    .action(async ({ parsedInput }) => {
        // const registry = await getRegistryById(parsedInput.id);
        //
        // await deleteRegistry(parsedInput.id);
        //
        // if (registry?.url) {
        //     try {
        //         await kyDocker.post('registries/logout', {
        //             json: { serveraddress: registry.url },
        //         });
        //     } catch { /* empty */ }
        // }

        revalidatePath('/admin/registry');
    });
