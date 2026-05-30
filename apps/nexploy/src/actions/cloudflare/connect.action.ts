'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { saveCloudflareCredential } from '@/services/cloudflare.service';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';
import { getPublicIp } from '@/lib/network/getPublicIp.ts';

export const connectCloudflareAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(cloudflareConnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { displayName, apiToken } = parsedInput;
            const serverIp = await getPublicIp();
            if (!serverIp) throw new Error('Failed to get server IP');

            await saveCloudflareCredential(ctx.session.user.id, displayName, apiToken, serverIp);
            revalidatePath('/integrations');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
