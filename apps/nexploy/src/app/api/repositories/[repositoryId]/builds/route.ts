import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import {
    buildsQuerySchema,
    repositoryIdParamSchema,
} from '@workspace/schemas-zod/api/params.schema';
import { getBuildsPage } from '@/services/repository/build.service';
import { BUILDS_PAGE_SIZE } from '@/lib/constants';
import { byRepositoryIdParam } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read', byRepositoryIdParam))
    .params(repositoryIdParamSchema)
    .query(buildsQuerySchema)
    .handler(async (_, { params, query }) => {
        const { repositoryId } = params;
        const { cursor, take, stage } = query;

        const builds = await getBuildsPage(repositoryId, stage, cursor, take);
        const lastBuild = builds[builds.length - 1];
        const nextCursor = builds.length === BUILDS_PAGE_SIZE && lastBuild ? lastBuild.id : null;

        return NextResponse.json({ builds, nextCursor });
    });
