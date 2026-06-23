'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { saveCloudflareCredential } from '@/services/cloudflare.service';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';
import { getPublicIp } from '@/lib/network/getPublicIp.ts';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const connectCloudflareAction = authActionServer
    .use(requirePermission('dns', 'manage'))
    .inputSchema(cloudflareConnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { displayName, apiToken } = parsedInput;
            const serverIp = await getPublicIp();
            if (!serverIp) throw new Error((await getErrorTranslator())('cloudflare.getServerIpFailed'));

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
