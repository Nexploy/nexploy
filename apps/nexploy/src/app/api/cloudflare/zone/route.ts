import { authRouteServer, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { listCloudflareZones } from '@/services/cloudflare.service';
import { Session } from '@/lib/auth/auth';

export const GET = route
    .use(authRouteServer)
    .handler(async (_, { ctx }: { ctx: { session: Session } }) => {
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
