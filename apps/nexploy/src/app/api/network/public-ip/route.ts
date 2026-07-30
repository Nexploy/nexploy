import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import { getPublicIp } from '@/lib/network/getPublicIp';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read', HOST_SCOPED))
    .handler(async () => {
        const ip = await getPublicIp();

        if (!ip) {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.publicIpFailed') }, { status: 503 });
        }
        return NextResponse.json({ ip });
    });
