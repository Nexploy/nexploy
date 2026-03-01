import { getRepositories } from '@/services/git/git.service';
import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (request, { ctx }: { ctx: { session: Session } }) => {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const gitAccountId = searchParams.get('gitAccountId');

        if (!provider || !gitAccountId)
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

        try {
            const repositories = await getRepositories(provider, gitAccountId, ctx.session.user.id);
            return NextResponse.json(repositories);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to fetch repositories' },
                { status: 500 },
            );
        }
    });
