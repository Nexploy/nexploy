import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAllEnvsBuild } from '@/services/repository/build.service';
import { stageParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(stageParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { stageId } = params;
            const envVariables = await getAllEnvsBuild(stageId);
            return NextResponse.json(envVariables);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch env variables' }, { status: 500 });
        }
    });
