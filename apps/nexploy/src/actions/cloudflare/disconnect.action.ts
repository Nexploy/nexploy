'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { cloudflareDisconnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { removeCloudflareCredential } from '@/services/cloudflare.service';

export const disconnectCloudflareAction = authActionServer
    .inputSchema(cloudflareDisconnectSchema)
    .action(async ({ ctx }) => {
        await removeCloudflareCredential(ctx.session.user.id);
        return { success: true };
    });
