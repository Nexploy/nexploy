'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { cloudflareConnectSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { saveCloudflareCredential } from '@/services/cloudflare.service';

export const connectCloudflareAction = authActionServer
    .inputSchema(cloudflareConnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { apiToken } = parsedInput;
        await saveCloudflareCredential(ctx.session.user.id, apiToken);
        return { success: true };
    });
