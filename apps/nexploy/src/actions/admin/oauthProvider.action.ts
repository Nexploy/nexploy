'use server';

import { authActionServer, adminOnly } from '@/lib/api/safe-action';
import {
    gitlabProviderSchema,
    deleteGitProviderSchema,
} from '@workspace/schemas-zod/admin/oauthProvider.schema';
import {
    saveGitLabProvider,
    deleteGitProvider,
} from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';

export const saveGitLabProviderAction = authActionServer
    .use(adminOnly)
    .inputSchema(gitlabProviderSchema)
    .action(async ({ parsedInput }) => {
        const { displayName, clientId, clientSecret } = parsedInput;
        await saveGitLabProvider(displayName, clientId, clientSecret);
        revalidatePath('/admin/integrations');
        return { success: true };
    });

export const deleteGitProviderAction = authActionServer
    .use(adminOnly)
    .inputSchema(deleteGitProviderSchema)
    .action(async ({ parsedInput }) => {
        const { id } = parsedInput;
        await deleteGitProvider(id);
        revalidatePath('/admin/integrations');
        return { success: true };
    });
