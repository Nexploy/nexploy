import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getPipelineConfig } from '@/services/pipeline.service';
import { stageParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { byRepositoryIdParam } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('pipeline', 'read', byRepositoryIdParam))
    .params(stageParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { stageId } = params;
            const config = await getPipelineConfig(stageId);

            if (!config) {
                return NextResponse.json({ nodes: [], edges: [] });
            }

            return NextResponse.json(config);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.pipelineConfigFetchFailed') }, { status: 500 });
        }
    });
