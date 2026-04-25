import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getRepositoryWebhookStatus } from '@/services/repository.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId } = params;

        const repo = await getRepositoryWebhookStatus(repositoryId);

        if (!repo) {
            return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
        }

        return NextResponse.json({ isConfigured: !!repo.webhookId });
    });
