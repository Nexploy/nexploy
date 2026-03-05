import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getPipelineConfig } from '@/services/pipeline.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = await params;
            const config = await getPipelineConfig(repositoryId as string);

            if (!config) {
                return NextResponse.json({ nodes: [], edges: [] });
            }

            return NextResponse.json(config);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch pipeline config' }, { status: 500 });
        }
    });
