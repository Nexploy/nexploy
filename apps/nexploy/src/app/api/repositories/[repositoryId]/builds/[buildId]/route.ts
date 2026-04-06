import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildPipelineStatus } from '@/services/pipeline.service';
import { buildParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(buildParamSchema)
    .handler(async (_, { params }) => {
        const { buildId } = params;
        const status = await getBuildPipelineStatus(buildId);

        if (!status) {
            return NextResponse.json({ error: 'Build not found' }, { status: 404 });
        }

        return NextResponse.json(status);
    });
