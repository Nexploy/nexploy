import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import type { DiskUsage } from '@workspace/typescript-interface/docker/docker.system';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('docker', 'read'))
    .handler(async () => {
        try {
            const diskUsage = await kyDocker.get('system/df').json<DiskUsage>();
            return NextResponse.json(diskUsage);
        } catch (error) {
            return NextResponse.json({ error: 'Failed to fetch disk usage' }, { status: 500 });
        }
    });
