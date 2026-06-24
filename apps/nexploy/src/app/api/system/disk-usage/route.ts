import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import type { DiskUsage } from '@workspace/typescript-interface/docker/docker.system';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('monitoring', 'read'))
    .handler(async () => {
        try {
            const diskUsage = await kyDocker.get('system/df').json<DiskUsage>();
            return NextResponse.json(diskUsage);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.diskUsageFetchFailed') }, { status: 500 });
        }
    });
