import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { getDnsAccounts } from '@/services/dns/dnsCredential.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('dns', 'read'))
    .handler(async (_request: Request) => {
        try {
            return await getDnsAccounts();
        } catch {
            await setToastServer({
                type: 'error',
                message: 'Error while fetching DNS accounts',
            });
            return;
        }
    });
