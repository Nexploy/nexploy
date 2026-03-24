import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { prisma } from '../../../../../../prisma/prisma';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (_request, { params }) => {
        const { repositoryId } = await params;

        const repo = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { webhookId: true },
        });

        if (!repo) {
            return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
        }

        return NextResponse.json({ isConfigured: !!repo.webhookId });
    });
