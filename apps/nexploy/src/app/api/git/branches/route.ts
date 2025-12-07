import { getBranches } from '@/services/git/git.service';
import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';

export const GET = route.use(authRouteServer).handler(async (request, { ctx }: any) => {
    const { searchParams } = new URL(request.url);

    const provider = searchParams.get('provider');
    const repoId = searchParams.get('repoId');
    const owner = searchParams.get('owner') || undefined;
    const repoName = searchParams.get('repoName') || undefined;

    if (!provider || (provider !== 'github' && provider !== 'gitlab')) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (!repoId) {
        return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 });
    }

    try {
        const branches = await getBranches(provider, repoId, ctx.session.user.id, owner, repoName);
        return NextResponse.json(branches);
    } catch (error: any) {
        console.log({ error });
        return NextResponse.json(
            { error: error.message || 'Failed to fetch branches' },
            { status: 500 },
        );
    }
});
