'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { domainFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { createDomain } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';
import { byDomainContainerName } from '@/lib/auth/resolveOrgContext';

export const addDomain = authActionServer
    .use(requirePermission('domain', 'manage', byDomainContainerName))
    .inputSchema(domainFormSchema)
    .action(async ({ parsedInput: { domain } }) => {
        try {
            return await createDomain(domain);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
