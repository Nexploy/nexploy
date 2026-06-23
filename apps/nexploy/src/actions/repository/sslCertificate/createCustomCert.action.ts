'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createCustomCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import { createCustomCertificate } from '@/services/sslCertificate.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const createCustomCert = authActionServer
    .use(requirePermission('ssl', 'manage'))
    .inputSchema(createCustomCertSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await createCustomCertificate(
                parsedInput.name,
                parsedInput.domain,
                parsedInput.certificate,
                parsedInput.privateKey,
            );
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
