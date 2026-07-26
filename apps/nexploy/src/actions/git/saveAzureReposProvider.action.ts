'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveAzureReposProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { azureReposSetupSchema } from '@workspace/schemas-zod/git/azureReposSetup.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const saveAzureReposProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(azureReposSetupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, clientId, clientSecret, tenantId } = parsedInput;
            await saveAzureReposProvider(displayName, clientId, clientSecret, tenantId);
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
