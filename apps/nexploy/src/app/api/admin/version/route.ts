import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import type { VersionInfo } from '@workspace/typescript-interface/stores/updateStore';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('setting', 'read'))
    .handler(async () => {
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json({
                current: 'dev',
                latest: 'dev',
                updateAvailable: false,
                releaseUrl: null,
                releasesUrl: null,
            } satisfies VersionInfo);
        }

        try {
            const version = await kyDocker.get('system/version', { timeout: 10_000 }).json<VersionInfo>();
            return NextResponse.json(version);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.versionCheckFailed') }, { status: 500 });
        }
    });
