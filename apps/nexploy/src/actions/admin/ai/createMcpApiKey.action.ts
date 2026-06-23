'use server';

import { auth } from '@/lib/auth/auth';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createMcpApiKeySchema } from '@workspace/schemas-zod/ai/mcpApiKey.schema';
import { setToastServer } from '@/lib/toastServer';

export const createMcpApiKeyAction = authActionServer
    .use(requirePermission('mcpKey', 'create'))
    .inputSchema(createMcpApiKeySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
