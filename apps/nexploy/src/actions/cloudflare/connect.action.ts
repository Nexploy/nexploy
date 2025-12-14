'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { saveCloudflareCredential } from '@/services/cloudflare.service';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const connectCloudflareAction = authActionServer
    .inputSchema(cloudflareConnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { apiToken, serverIp } = parsedInput;
            return await saveCloudflareCredential(ctx.session.user.id, apiToken, serverIp);
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
