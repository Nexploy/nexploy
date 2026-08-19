import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import type { DiskGuardStatus } from '@workspace/typescript-interface/docker/docker.disk';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('monitoring', 'read'))
    .handler(async () => {
        try {
            const status = await kyDocker.get('system/disk').json<DiskGuardStatus>();
            return NextResponse.json(status);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('diskGuard.statusFailed') }, { status: 500 });
        }
    });
