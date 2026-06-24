import { NextResponse } from 'next/server';
import { getCertificates } from '@/services/sslCertificate.service';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('ssl', 'read'))
    .handler(async () => {
        try {
            const certificates = await getCertificates();
            return NextResponse.json(certificates);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('api.certificatesFetchFailed') }, { status: 500 });
        }
    });
