import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRepositories } from '@/services/repository.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (_, { ctx }) => {
        try {
            const repositories = await getRepositories(
                ctx.session.user.id,
                ctx.session.user.role === 'admin',
            );
            return NextResponse.json(repositories);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.repositoriesFetchFailed') }, { status: 500 });
        }
    });
