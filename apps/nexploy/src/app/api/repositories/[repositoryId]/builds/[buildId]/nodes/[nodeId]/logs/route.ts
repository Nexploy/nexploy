import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildNodeLogs } from '@/services/repository.service';
import { buildNodeParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { byRepositoryIdParam } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read', byRepositoryIdParam))
    .params(buildNodeParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId, buildId, nodeId } = params;

        const logs = await getBuildNodeLogs(repositoryId, buildId, nodeId);

        if (!logs) {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.buildNotFound') }, { status: 404 });
        }

        return NextResponse.json(logs);
    });
