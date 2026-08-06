import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getConfiguredProviders } from '@/services/aiConfig.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('ai', 'read'))
    .handler(async () => {
        const providers = await getConfiguredProviders();
        return NextResponse.json({ providers });
    });
