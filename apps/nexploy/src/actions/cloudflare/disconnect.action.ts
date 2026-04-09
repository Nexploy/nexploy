'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { removeCloudflareCredential } from '@/services/cloudflare.service';
import { setToastServer } from '@/lib/toastServer';

export const disconnectCloudflareAction = authActionServer
    .use(requirePermission('gitProvider', 'delete'))
    .action(async ({ ctx }) => {
        try {
            return await removeCloudflareCredential(ctx.session.user.id);
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
