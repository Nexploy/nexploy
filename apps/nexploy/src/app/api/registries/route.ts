import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRegistries } from '@/services/registry.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('registry', 'read'))
    .handler(async () => {
        const registries = await getRegistries();
        return NextResponse.json(registries);
    });
