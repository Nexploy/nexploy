import { NextResponse } from 'next/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { downloadVolumeQuerySchema } from '@workspace/schemas-zod/aws/aws.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .query(downloadVolumeQuerySchema)
    .handler(async (_, { query }) => {
        const { volume: volumeName } = query;

        const buffer = await kyDocker
            .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
            .arrayBuffer();

        const filename = `${volumeName}-${Date.now()}.tar.gz`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/gzip',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(buffer.byteLength),
            },
        });
    });
