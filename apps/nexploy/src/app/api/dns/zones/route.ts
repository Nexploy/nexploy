import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { listDnsZones } from '@/services/dns/dnsCredential.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('dns', 'read'))
    .handler(async (request: Request) => {
        try {
            const { searchParams } = new URL(request.url);
            const credentialId = searchParams.get('credentialId')!;

            return await listDnsZones(credentialId);
        } catch {
            await setToastServer({
                type: 'error',
                message: 'Error while fetching DNS zones',
            });
            return;
        }
    });
