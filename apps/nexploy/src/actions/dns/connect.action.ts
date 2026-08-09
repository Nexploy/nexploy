'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { dnsConnectSchema } from '@workspace/schemas-zod/dns/dns.schema';
import { saveDnsCredential } from '@/services/dns/dnsCredential.service';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { revalidatePath } from 'next/cache';
import { getPublicIp } from '@/lib/network/getPublicIp.ts';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const connectDnsAction = authActionServer
    .metadata({ name: 'dns.connect' })
    .use(requirePermission('dns', 'manage'))
    .inputSchema(dnsConnectSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { provider, displayName, credentials } = parsedInput;
            const serverIp = await getPublicIp();
            if (!serverIp) throw new Error((await getErrorTranslator())('dns.getServerIpFailed'));

            await saveDnsCredential(ctx.session.user.id, provider, displayName, credentials, serverIp);
            revalidatePath('/integrations');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
