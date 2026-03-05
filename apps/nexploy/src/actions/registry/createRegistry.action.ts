'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { createRegistry } from '@/services/registry.service';
import { revalidatePath } from 'next/cache';

export const createRegistryAction = authActionServer
    .use(requirePermission('registry', 'create'))
    .inputSchema(createRegistrySchema)
    .action(async ({ parsedInput }) => {
        await createRegistry(parsedInput);
        revalidatePath('/admin/registry');
    });
