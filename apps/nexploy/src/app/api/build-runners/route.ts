import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildRunners } from '@/services/buildRunner.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('buildRunner', 'read'))
    .handler(async () => {
        const runners = await getBuildRunners();
        return NextResponse.json(runners);
    });
