import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../../../prisma/prisma';
import { route } from '@/lib/api/nextRoute';

export const GET = route.handler(async (request, { params }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        return NextResponse.json(environment);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed to fetch environment' }, { status: 500 });
    }
});
