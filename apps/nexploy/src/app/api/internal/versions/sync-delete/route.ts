import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/prisma';
import { internalApiAuth, route } from '@/lib/api/nextRoute';

export const POST = route.use(internalApiAuth).handler(async (_, { body }) => {
    const { repositoryId, imageTag } = body;

    if (!repositoryId || !imageTag) {
        return NextResponse.json(
            { error: 'repositoryId and imageTag are required' },
            { status: 400 },
        );
    }

    const result = await prisma.version.deleteMany({
        where: { repositoryId, imageTag },
    });

    return NextResponse.json({ deleted: result.count });
});
