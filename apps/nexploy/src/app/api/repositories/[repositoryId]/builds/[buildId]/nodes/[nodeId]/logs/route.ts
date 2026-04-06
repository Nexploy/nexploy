import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildNodeLogs } from '@/services/repository.service';
import { buildNodeParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(buildNodeParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId, buildId, nodeId } = params;

        const logs = await getBuildNodeLogs(repositoryId, buildId, nodeId);

        if (!logs) {
            return NextResponse.json({ error: 'Build not found' }, { status: 404 });
        }

        return NextResponse.json(logs);
    });
