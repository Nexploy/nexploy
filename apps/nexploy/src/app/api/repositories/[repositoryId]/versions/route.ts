import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { getVersionsByRepository } from '@/services/docker/version.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        const { repositoryId } = params;

        const versions = await getVersionsByRepository(repositoryId);

        return NextResponse.json({ versions });
    });
