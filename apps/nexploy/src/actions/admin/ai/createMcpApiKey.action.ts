'use server';

import { auth } from '@/lib/auth/auth';
import { authActionServer } from '@/lib/api/safe-action';
import { createMcpApiKeySchema } from '@workspace/schemas-zod/ai/mcpApiKey.schema';

export const createMcpApiKeyAction = authActionServer
    .inputSchema(createMcpApiKeySchema)
    .action(async ({ parsedInput, ctx }) => {
        const apiKey = await auth.api.createApiKey({
            body: {
                name: parsedInput.name,
                userId: ctx.session.user.id,
                prefix: 'nxp_mcp_',
                expiresIn: undefined,
                metadata: { purpose: 'mcp' },
            },
        });

        return { key: apiKey.key, id: apiKey.id };
    });
