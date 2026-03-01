import { NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { decrypt } from '@/lib/encryption';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('environment', 'read'))
    .handler(async (_, { params }) => {
    try {
        const { id } = await params;

        const environment = await prisma.environment.findUnique({
            where: {
                id: id,
                isActive: true,
            },
        });

        if (!environment) {
            return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...environment,
            tlsCert: environment.tlsCert ? decrypt(environment.tlsCert) : null,
            tlsKey: environment.tlsKey ? decrypt(environment.tlsKey) : null,
            tlsCa: environment.tlsCa ? decrypt(environment.tlsCa) : null,
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed to fetch environment' }, { status: 500 });
    }
});
