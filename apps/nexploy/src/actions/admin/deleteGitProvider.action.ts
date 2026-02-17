'use server';

import { adminOnly, authActionServer } from '@/lib/api/safe-action';
import { deleteGitProviderSchema } from '@workspace/schemas-zod/admin/oauthProvider.schema';
import { deleteGitProvider } from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';

export const deleteGitProviderAction = authActionServer
    .use(adminOnly)
    .inputSchema(deleteGitProviderSchema)
    .action(async ({ parsedInput }) => {
        const { id } = parsedInput;
        await deleteGitProvider(id);
        revalidatePath('/admin/integrations');
    });
