'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { removeCloudflareCredential } from '@/services/cloudflare.service';
import { cloudflareDeleteSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const disconnectCloudflareAction = authActionServer
    .use(requirePermission('dns', 'manage'))
    .inputSchema(cloudflareDeleteSchema)
    .action(async ({ parsedInput }) => {
        try {
            await removeCloudflareCredential(parsedInput.id);
            revalidatePath('/integrations');
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
