import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRepositories } from '@/services/repository.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async () => {
        try {
            const repositories = await getRepositories();
            return NextResponse.json(repositories);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
        }
    });
