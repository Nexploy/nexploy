import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRepositorieById } from '@/services/repository.service';
import { repositoryIdParamSchema } from '@workspace/schemas-zod/api/params.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .params(repositoryIdParamSchema)
    .handler(async (_, { params }) => {
        try {
            const { repositoryId } = params;
            const repository = await getRepositorieById(repositoryId);

            if (!repository) {
                return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
            }

            return NextResponse.json(repository);
        } catch {
            return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 });
        }
    });
