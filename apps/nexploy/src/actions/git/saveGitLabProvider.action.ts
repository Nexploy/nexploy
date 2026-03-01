'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveGitLabProvider } from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';
import { gitlabSetupSchema } from '@workspace/schemas-zod/git/gitlabSetup.schema';

export const saveGitLabProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(gitlabSetupSchema)
    .action(async ({ parsedInput }) => {
        const { displayName, clientId, clientSecret, useCustomUrl, baseUrl } = parsedInput;
        await saveGitLabProvider(
            displayName,
            clientId,
            clientSecret,
            useCustomUrl && baseUrl ? baseUrl : null,
        );
        revalidatePath('/admin/integrations');
    });
