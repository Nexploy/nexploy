'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { cloudflareZonesSchema } from '@workspace/schemas-zod/cloudflare/cloudflare.schema';
import { listCloudflareZones } from '@/services/cloudflare.service';

export const getCloudflareZonesAction = authActionServer
    .inputSchema(cloudflareZonesSchema)
    .action(async ({ ctx }) => {
        const zones = await listCloudflareZones(ctx.session.user.id);
        return zones;
    });
