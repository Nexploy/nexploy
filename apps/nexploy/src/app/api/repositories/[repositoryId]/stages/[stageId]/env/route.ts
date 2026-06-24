import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAllEnvsBuild } from '@/services/repository/build.service';
import { stageParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('envVar', 'read'))
    .params(stageParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { stageId } = params;
            const envVariables = await getAllEnvsBuild(stageId);
            return NextResponse.json(envVariables);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.envVariablesFetchFailed') }, { status: 500 });
        }
    });
