import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import { volumeExportParamsSchema } from '@workspace/schemas-zod/docker/volume/volumeBackup.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'create'))
    .params(volumeExportParamsSchema)
    .handler(async (_, { params }) => {
        const { volumeName } = params;

        try {
            const archive = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
                .arrayBuffer();

            return new Response(new Uint8Array(archive), {
                status: 200,
                headers: {
                    'Content-Type': 'application/gzip',
                    'Content-Disposition': `attachment; filename="${volumeName}-${Date.now()}.tar.gz"`,
                    'Content-Length': String(archive.byteLength),
                },
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Volume export failed';
            return NextResponse.json({ message }, { status: 500 });
        }
    });
