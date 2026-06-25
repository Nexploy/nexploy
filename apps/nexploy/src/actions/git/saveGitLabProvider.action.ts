'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveGitLabProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { gitlabSetupSchema } from '@workspace/schemas-zod/git/gitlabSetup.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const saveGitLabProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(gitlabSetupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, clientId, clientSecret, useCustomUrl, baseUrl } = parsedInput;
            await saveGitLabProvider(
                displayName,
                clientId,
                clientSecret,
                useCustomUrl && baseUrl ? baseUrl : null,
            );
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
