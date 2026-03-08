import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildPipelineStatus } from '@/services/pipeline.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (_, { params }) => {
        const { buildId } = await params;
        const status = await getBuildPipelineStatus(buildId);

        if (!status) {
            return NextResponse.json({ error: 'Build not found' }, { status: 404 });
        }

        return NextResponse.json(status);
    });
