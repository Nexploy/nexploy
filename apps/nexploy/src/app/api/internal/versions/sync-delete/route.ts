import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/prisma';
import { internalApiAuth, route } from '@/lib/api/nextRoute';
import { syncVersionDeleteSchema } from '@workspace/schemas-zod/repository/version.schema';

export const POST = route
    .use(internalApiAuth)
    .body(syncVersionDeleteSchema)
    .handler(async (_, { body }) => {
        const { repositoryId, imageTag } = body;

        const result = await prisma.version.deleteMany({
            where: { repositoryId, imageTag },
        });

        return NextResponse.json({ deleted: result.count });
    });
