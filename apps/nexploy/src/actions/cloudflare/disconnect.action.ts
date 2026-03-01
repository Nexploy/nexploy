'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { removeCloudflareCredential } from '@/services/cloudflare.service';

export const disconnectCloudflareAction = authActionServer
    .use(requirePermission('gitProvider', 'delete'))
    .action(async ({ ctx }) => {
    await removeCloudflareCredential(ctx.session.user.id);
    return { success: true };
});
