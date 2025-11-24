import { getRepositories } from '@/services/git/git.service';
import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { ProvidersGit } from '@workspace/typescript-interface/git';

export const GET = route.use(authRouteServer).handler(async (request) => {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as ProvidersGit;

    if (!provider) return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

    try {
        const repositories = await getRepositories(provider);
        return NextResponse.json(repositories);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch repositories' },
            { status: 500 },
        );
    }
});
