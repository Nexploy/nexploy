import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getActiveBuilds } from '@/services/repository/build.service';

interface ActiveBuildInfo {
    id: string;
    repositoryName: string;
    status: string;
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('setting', 'read'))
    .handler(async () => {
        try {
            const builds = await getActiveBuilds();
            return NextResponse.json({
                builds: builds.map(
                    (build): ActiveBuildInfo => ({
                        id: build.id,
                        repositoryName: build.repository.name,
                        status: build.status,
                    }),
                ),
            });
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('build.getActiveBuildsFailed') }, { status: 500 });
        }
    });
