import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { prisma } from '../../../../../../prisma/prisma';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId } = params;

        const repo = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { webhookId: true },
        });

        if (!repo) {
            return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
        }

        return NextResponse.json({ isConfigured: !!repo.webhookId });
    });
