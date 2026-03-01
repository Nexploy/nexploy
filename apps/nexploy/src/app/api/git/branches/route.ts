import { getBranches } from '@/services/git/git.service';
import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (request, { ctx }: { ctx: { session: Session } }) => {
        const { searchParams } = new URL(request.url);

        const provider = searchParams.get('provider');
        const repoId = searchParams.get('repoId');
        const owner = searchParams.get('owner');
        const repoName = searchParams.get('repoName');
        const gitAccountId = searchParams.get('gitAccountId');

        if (
            !provider ||
            (provider !== 'github' && provider !== 'gitlab') ||
            !gitAccountId ||
            !owner ||
            !repoName
        ) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        if (!repoId) {
            return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 });
        }

        try {
            const branches = await getBranches(
                provider,
                repoId,
                ctx.session.user.id,
                gitAccountId,
                owner,
                repoName,
            );
            return NextResponse.json(branches);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to fetch branches' },
                { status: 500 },
            );
        }
    });
