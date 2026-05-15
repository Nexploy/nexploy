'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveGitLabProvider } from '@/services/oauthProvider.service';
import { revalidatePath } from 'next/cache';
import { gitlabSetupSchema } from '@workspace/schemas-zod/git/gitlabSetup.schema';
import { getTranslations } from 'next-intl/server';

async function getGitlabSetupSchema() {
    const t = await getTranslations('validation');
    return gitlabSetupSchema(t);
}

export const saveGitLabProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(getGitlabSetupSchema)
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
