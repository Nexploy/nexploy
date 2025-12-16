'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { removeCloudflareCredential } from '@/services/cloudflare.service';

export const disconnectCloudflareAction = authActionServer.action(async ({ ctx }) => {
    await removeCloudflareCredential(ctx.session.user.id);
    return { success: true };
});
