'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { updateRegistry } from '@/services/registry.service';
import { revalidatePath } from 'next/cache';

export const updateRegistryAction = authActionServer
    .use(requirePermission('registry', 'update'))
    .inputSchema(updateRegistrySchema)
    .action(async ({ parsedInput }) => {
        await updateRegistry(parsedInput);
        revalidatePath('/admin/registry');
    });
