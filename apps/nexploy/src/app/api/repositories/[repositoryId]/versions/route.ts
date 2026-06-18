import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import {
    repositoryIdParamSchema,
    stageQuerySchema,
} from '@workspace/schemas-zod/api/params.schema';
import { getVersionsByRepository } from '@/services/docker/version.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .query(stageQuerySchema)
    .handler(async (_, { params, query }) => {
        const { repositoryId } = params;

        const versions = await getVersionsByRepository(repositoryId, query.stage);

        return NextResponse.json({ versions });
    });
