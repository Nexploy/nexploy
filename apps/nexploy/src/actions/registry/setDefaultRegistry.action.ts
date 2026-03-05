'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setDefaultRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { setDefaultRegistry } from '@/services/registry.service';
import { revalidatePath } from 'next/cache';

export const setDefaultRegistryAction = authActionServer
    .use(requirePermission('registry', 'update'))
    .inputSchema(setDefaultRegistrySchema)
    .action(async ({ parsedInput }) => {
        await setDefaultRegistry(parsedInput.id);
        revalidatePath('/admin/registry');
    });
