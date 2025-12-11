import { authRouteServer, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { listCloudflareZones } from '@/services/cloudflare.service';

export const GET = route.use(authRouteServer).handler(async (request, { ctx }: any) => {
    try {
        return await listCloudflareZones(ctx.session.user.id);
    } catch {
        await setToastServer({
            type: 'error',
            message: 'Error while fetching Cloudflare zones',
        });
        return;
    }
});
