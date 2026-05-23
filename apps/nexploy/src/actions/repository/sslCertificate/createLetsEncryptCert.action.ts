'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createLetsEncryptCertSchema } from '@workspace/schemas-zod/repository/sslCertificate.schema';
import { createLetsEncryptCertificate } from '@/services/sslCertificate.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const createLetsEncryptCert = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(createLetsEncryptCertSchema)
    .action(async ({ parsedInput }) => {
        try {
            return createLetsEncryptCertificate(
                parsedInput.name,
                parsedInput.domain,
                parsedInput.email,
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
