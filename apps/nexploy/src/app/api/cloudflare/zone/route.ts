import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { listCloudflareZones } from '@/services/cloudflare.service';
import { Session } from '@/lib/auth/auth';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('gitProvider', 'create'))
    .handler(async (request: Request, { ctx }: { ctx: { session: Session } }) => {
        try {
            const { searchParams } = new URL(request.url);
            const credentialId = searchParams.get('credentialId')!;

            return await listCloudflareZones(credentialId);
        } catch {
            await setToastServer({
                type: 'error',
                message: 'Error while fetching Cloudflare zones',
            });
            return;
        }
    });
