'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteDomainSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { removeDomain } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';
import { revalidatePath } from 'next/cache';

export const deleteDomain = authActionServer
    .use(requirePermission('domain', 'manage'))
    .inputSchema(deleteDomainSchema)
    .action(async ({ parsedInput: { domainId } }) => {
        try {
            await removeDomain(domainId);
            revalidatePath('/domains', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
        }
    });
