import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { getCloudflareAccounts } from '@/services/cloudflare.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('dns', 'read'))
    .handler(async (_request: Request) => {
        try {
            return await getCloudflareAccounts();
        } catch {
            await setToastServer({
                type: 'error',
                message: 'Error while fetching Cloudflare accounts',
            });
            return;
        }
    });
