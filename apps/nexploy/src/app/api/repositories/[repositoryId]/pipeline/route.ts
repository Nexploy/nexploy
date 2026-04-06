import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getPipelineConfig } from '@/services/pipeline.service';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = params;
            const config = await getPipelineConfig(repositoryId);

            if (!config) {
                return NextResponse.json({ nodes: [], edges: [] });
            }

            return NextResponse.json(config);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch pipeline config' }, { status: 500 });
        }
    });
