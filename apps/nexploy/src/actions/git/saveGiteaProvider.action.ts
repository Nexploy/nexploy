'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveGiteaProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { giteaSetupSchema } from '@workspace/schemas-zod/git/giteaSetup.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const saveGiteaProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(giteaSetupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, clientId, clientSecret, baseUrl } = parsedInput;
            await saveGiteaProvider(displayName, clientId, clientSecret, baseUrl);
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
