import { NextResponse } from 'next/server';
import { getAllCertificates } from '@/services/sslCertificate.service';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async () => {
        try {
            const certificates = await getAllCertificates();
            return NextResponse.json(certificates);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
        }
    });
