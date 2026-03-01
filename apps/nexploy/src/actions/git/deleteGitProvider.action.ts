'use server';

import { deleteGitProviderSchema } from '@workspace/schemas-zod/git/git.schema';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteGitProvider } from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';

export const deleteGitProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'delete'))
    .inputSchema(deleteGitProviderSchema)
    .action(async ({ parsedInput }) => {
        const { id } = parsedInput;
        await deleteGitProvider(id);
        revalidatePath('/admin/integrations');
    });
