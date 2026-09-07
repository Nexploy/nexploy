import { NextResponse } from 'next/server';
import { idParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getDockerAgentByEnvironmentId } from '@/services/environment/dockerAgent.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('environment', 'read'))
    .params(idParamSchema)
    .handler(async (_, { params }) => {
        try {
            const agent = await getDockerAgentByEnvironmentId(params.id);

            if (!agent) {
                const t = await getErrorTranslator();
                return NextResponse.json({ error: t('api.agentNotFound') }, { status: 404 });
            }

            return NextResponse.json(agent);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.agentFetchFailed') }, { status: 500 });
        }
    });
