import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { getConfiguredProviders } from '@/services/aiConfig.service';

export const GET = route
    .use(authRouteServer)
    .handler(async () => {
        const providers = await getConfiguredProviders();
        return NextResponse.json({ providers });
    });
