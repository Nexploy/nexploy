'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveBitbucketProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { bitbucketSetupSchema } from '@workspace/schemas-zod/git/bitbucketSetup.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const saveBitbucketProviderAction = authActionServer
    .metadata({ name: 'git.saveBitbucketProvider' })
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(bitbucketSetupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, clientId, clientSecret } = parsedInput;
            await saveBitbucketProvider(displayName, clientId, clientSecret);
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
