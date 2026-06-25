import { getBranches } from '@/services/git/gitAccounts.service';
import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';
import { getBranchesSchema } from '@workspace/schemas-zod/git/git.schema';
import { z } from 'zod';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .query(getBranchesSchema)
    .handler(
        async (
            _,
            {
                ctx,
                query,
            }: {
                ctx: { session: Session };
                query: z.infer<typeof getBranchesSchema>;
            },
        ) => {
            const { provider, repoId, owner, repoName, gitAccountId } = query;

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
        },
    );
