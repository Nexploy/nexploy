import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getRepositoryWebhookStatus } from '@/services/repository.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId } = params;

        const repo = await getRepositoryWebhookStatus(repositoryId);

        if (!repo) {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.repositoryNotFound') }, { status: 404 });
        }

        return NextResponse.json({ isConfigured: !!repo.webhookId });
    });
