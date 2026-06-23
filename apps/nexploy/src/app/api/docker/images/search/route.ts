import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { searchDockerHubImages } from '@/services/dockerHub.service';
import type { DockerHubSort } from '@workspace/typescript-interface/docker/docker.hub';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('image', 'read'))
    .handler(async (request: Request) => {
        try {
            const { searchParams } = new URL(request.url);
            const query = searchParams.get('query') ?? '';
            const sortParam = searchParams.get('sort');
            const sort: DockerHubSort = sortParam === 'relevance' ? 'relevance' : 'pull_count';
            const from = Math.max(0, Number(searchParams.get('from')) || 0);

            const images = await searchDockerHubImages(query, { sort, from });
            return NextResponse.json(images);
        } catch {
            return NextResponse.json(
                { error: 'Failed to search Docker Hub images' },
                { status: 500 },
            );
        }
    });
