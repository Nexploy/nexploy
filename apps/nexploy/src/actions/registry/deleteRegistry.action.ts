'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { deleteRegistry } from '@/services/registry.service';
import { revalidatePath } from 'next/cache';

export const deleteRegistryAction = authActionServer
    .use(requirePermission('registry', 'delete'))
    .inputSchema(deleteRegistrySchema)
    .action(async ({ parsedInput }) => {
        await deleteRegistry(parsedInput.id);
        revalidatePath('/admin/registry');
    });
