import { NextResponse } from 'next/server';
import { route, authRouteServer } from '@/lib/api/nextRoute';
import { listGitAccounts } from '@/services/git/git.service';

export const GET = route.use(authRouteServer).handler(async (_request, { ctx }: any) => {
    try {
        const accounts = await listGitAccounts(ctx.session.user.id);
        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch git accounts' },
            { status: 500 },
        );
    }
});
