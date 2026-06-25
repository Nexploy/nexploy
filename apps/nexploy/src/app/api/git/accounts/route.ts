import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { listGitAccounts } from '@/services/git/gitAccounts.service';
import { Session } from '@/lib/auth/auth';

export const GET = route
    .use(authRouteServer)
    .handler(async (_request, { ctx }: { ctx: { session: Session } }) => {
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
