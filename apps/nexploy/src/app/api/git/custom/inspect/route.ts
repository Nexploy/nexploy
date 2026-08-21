import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { customRepositoryUrlSchema } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { inspectCustomRepository } from '@/services/git/gitAccounts.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'create', HOST_SCOPED))
    .query(customRepositoryUrlSchema)
    .handler(async (_, { query }) => {
        const t = await getErrorTranslator();

        try {
            return NextResponse.json(await inspectCustomRepository(query.repositoryUrl));
        } catch (error: unknown) {
            const reason = error instanceof Error ? error.message : '';
            const message =
                reason === 'REPOSITORY_NOT_PUBLIC' ? t('git.repositoryNotPublic') : t('git.repositoryUnreachable');

            return NextResponse.json({ error: message }, { status: 400 });
        }
    });
