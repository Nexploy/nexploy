'use server';

import { auth } from '@/lib/auth/auth';
import { authActionServer } from '@/lib/api/safe-action';
import { headers } from 'next/headers';
import { z } from 'zod';

export const deleteMcpApiKeyAction = authActionServer
    .inputSchema(z.object({ keyId: z.string().min(1) }))
    .action(async ({ parsedInput }) => {
        await auth.api.deleteApiKey({
            body: { keyId: parsedInput.keyId },
            headers: await headers(),
        });

        return { success: true };
    });
