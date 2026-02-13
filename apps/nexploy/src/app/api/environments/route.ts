import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../../prisma/prisma';
import { route } from '@/lib/api/nextRoute';
import { decrypt } from '@/lib/encryption';

export const GET = route.handler(async (request) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
