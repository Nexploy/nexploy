'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { removeDnsCredential } from '@/services/dns/dnsCredential.service';
import { dnsDeleteSchema } from '@workspace/schemas-zod/dns/dns.schema';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';

export const disconnectDnsAction = authActionServer
    .metadata({ name: 'dns.disconnect' })
    .use(requirePermission('dns', 'manage'))
    .inputSchema(dnsDeleteSchema)
    .action(async ({ parsedInput }) => {
        try {
            await removeDnsCredential(parsedInput.id);
            revalidatePath('/integrations');
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
