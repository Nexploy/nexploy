'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import { deleteSslCertificate } from '@/services/sslCertificate.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const deleteSslCert = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(deleteCertSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteSslCertificate(parsedInput.id);
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
