'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import { updateCustomCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import { updateCustomCertificate } from '@/services/sslCertificate.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const updateCustomCert = authActionServer
    .metadata({ name: 'sslCertificate.updateCustomCert' })
    .use(requirePermission('ssl', 'manage', HOST_SCOPED))
    .inputSchema(updateCustomCertSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await updateCustomCertificate(parsedInput);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
