'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { domainFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { updateDomain } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const editDomain = authActionServer
    .use(requirePermission('domain', 'manage'))
    .inputSchema(domainFormSchema)
    .action(async ({ parsedInput: { domain } }) => {
        try {
            return await updateDomain(domain);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
