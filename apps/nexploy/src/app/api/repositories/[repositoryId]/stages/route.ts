import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getStagesByRepository } from '@/services/repository/deploymentStage.service';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { byRepositoryIdParam } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('stage', 'read', byRepositoryIdParam))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = params;
            const stages = await getStagesByRepository(repositoryId);
            return NextResponse.json(stages);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.stagesFetchFailed') }, { status: 500 });
        }
    });
