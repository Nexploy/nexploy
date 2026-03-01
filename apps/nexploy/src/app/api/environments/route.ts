import { NextResponse } from 'next/server';
import { prisma } from '../../../../prisma/prisma';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { decrypt } from '@/lib/encryption';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('environment', 'read'))
    .handler(async () => {
    try {
        const environments = await prisma.environment.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                isDefault: 'desc',
            },
        });

        const decryptedEnvironments = environments.map((env) => ({
            ...env,
            tlsCert: env.tlsCert ? decrypt(env.tlsCert) : null,
            tlsKey: env.tlsKey ? decrypt(env.tlsKey) : null,
            tlsCa: env.tlsCa ? decrypt(env.tlsCa) : null,
        }));

        return NextResponse.json(decryptedEnvironments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch environments' }, { status: 500 });
    }
});
