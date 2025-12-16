import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../../prisma/prisma';
import { route } from '@/lib/api/nextRoute';

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

        return NextResponse.json(environments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch environments' }, { status: 500 });
    }
});
