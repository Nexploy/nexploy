'use server';

import { deleteGitProviderSchema } from '@workspace/schemas-zod/git/git.schema';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteGitProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer.ts';

export const deleteGitProviderAction = authActionServer
    .metadata({ name: 'git.deleteProvider' })
    .use(requirePermission('gitProvider', 'delete'))
    .inputSchema(deleteGitProviderSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { id } = parsedInput;
            await deleteGitProvider(id);
            revalidatePath('/admin/integrations');
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
