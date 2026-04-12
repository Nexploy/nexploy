import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getPublicIp } from '@/lib/network/getPublicIp';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async () => {
        const ip = await getPublicIp();

        if (!ip) return NextResponse.json({ error: 'Unable to detect public IP' }, { status: 503 });
        return NextResponse.json({ ip });
    });
