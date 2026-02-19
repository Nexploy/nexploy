'use server';

import { adminOnly, authActionServer } from '@/lib/api/safe-action';
import { gitlabProviderSchema } from '@workspace/schemas-zod/admin/oauthProvider.schema';
import { saveGitLabProvider } from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';

export const saveGitLabProviderAction = authActionServer
    .use(adminOnly)
    .inputSchema(gitlabProviderSchema)
    .action(async ({ parsedInput }) => {
        const { displayName, clientId, clientSecret } = parsedInput;
        await saveGitLabProvider(displayName, clientId, clientSecret);
        revalidatePath('/admin/integrations');
    });
