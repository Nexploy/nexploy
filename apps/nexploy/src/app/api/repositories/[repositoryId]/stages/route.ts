import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getStagesByRepository } from '@/services/repository/deploymentStage.service';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('stage', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = params;
            const stages = await getStagesByRepository(repositoryId);
            return NextResponse.json(stages);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
        }
    });
