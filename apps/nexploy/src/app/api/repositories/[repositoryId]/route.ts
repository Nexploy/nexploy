import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRepositorieById } from '@/services/repository.service';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = params;
            const repository = await getRepositorieById(repositoryId);

            if (!repository) {
                const t = await getErrorTranslator();
                return NextResponse.json({ error: t('api.repositoryNotFound') }, { status: 404 });
            }

            return NextResponse.json(repository);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.repositoryFetchFailed') }, { status: 500 });
        }
    });
