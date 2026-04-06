import { NextResponse } from 'next/server';
import { kyDocker } from '@/lib/api/kyDocker';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .handler(async (request) => {
        const { searchParams } = new URL(request.url);
        const volumeName = searchParams.get('volume');

        if (!volumeName) {
            return NextResponse.json({ error: 'volume parameter is required' }, { status: 400 });
        }

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
