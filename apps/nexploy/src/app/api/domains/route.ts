import { NextResponse } from 'next/server';
import { getVisibleDomains } from '@/services/visibleDomains.service';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { HOST_SCOPED } from '@/lib/auth/resolveOrgContext';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('domain', 'read', HOST_SCOPED))
    .handler(async (request) => {
        try {
            const containerName = new URL(request.url).searchParams.get('containerName');
            const domains = await getVisibleDomains();

            if (!containerName) {
                return NextResponse.json(domains);
            }

            const normalizedName = containerName.replace(/^\//, '');
            return NextResponse.json(
                domains.filter((domain) => domain.containerName?.replace(/^\//, '') === normalizedName),
            );
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.domainsFetchFailed') }, { status: 500 });
        }
    });
