'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { removeCloudflareCredential } from '@/services/cloudflare.service';
import { cloudflareDeleteSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const disconnectCloudflareAction = authActionServer
    .use(requirePermission('gitProvider', 'delete'))
    .inputSchema(cloudflareDeleteSchema)
    .action(async ({ parsedInput }) => {
        try {
            await removeCloudflareCredential(parsedInput.id);
            revalidatePath('/integrations');
        } catch (error: any) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
