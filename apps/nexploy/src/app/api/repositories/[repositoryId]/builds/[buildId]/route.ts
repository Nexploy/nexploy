import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBuildPipelineStatus } from '@/services/pipeline.service';
import { buildParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { byRepositoryIdParam } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read', byRepositoryIdParam))
    .params(buildParamSchema)
    .handler(async (_, { params }) => {
        const { buildId } = params;
        const status = await getBuildPipelineStatus(buildId);

        if (!status) {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.buildNotFound') }, { status: 404 });
        }

        return NextResponse.json(status);
    });
