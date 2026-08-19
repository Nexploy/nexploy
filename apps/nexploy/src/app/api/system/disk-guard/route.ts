import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getDiskGuardSettings } from '@/services/diskGuardSettings.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import type { DiskGuardSettings } from '@workspace/typescript-interface/docker/docker.disk';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('setting', 'read'))
    .handler(async () => {
        try {
            const settings = await getDiskGuardSettings();

            const payload: DiskGuardSettings = {
                enabled: settings.enabled,
                warnPercent: settings.warnPercent,
                blockPercent: settings.blockPercent,
                minFreeMb: settings.minFreeMb,
            };

            return NextResponse.json(payload);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('diskGuard.getFailed') }, { status: 500 });
        }
    });
