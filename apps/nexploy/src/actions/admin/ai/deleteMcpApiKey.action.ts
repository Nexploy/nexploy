'use server';

import { auth } from '@/lib/auth/auth';
import { authActionServer } from '@/lib/api/safe-action';
import { headers } from 'next/headers';
import { deleteMcpApiKeySchema } from '@workspace/schemas-zod/ai/mcpApiKey.schema';

export const deleteMcpApiKeyAction = authActionServer
    .inputSchema(deleteMcpApiKeySchema)
    .action(async ({ parsedInput }) => {
        await auth.api.deleteApiKey({
            body: { keyId: parsedInput.keyId },
            headers: await headers(),
        });

        return { success: true };
    });
