import { getRepositories } from '@/services/git/gitAccounts.service';
import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRepositoriesSchema } from '@workspace/schemas-zod/git/git.schema';
import { resolveActiveOrganizationId } from '@/lib/auth/resolveOrgContext';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .query(getRepositoriesSchema)
    .handler(async (_, { ctx, query }) => {
        const { provider, gitAccountId } = query;

        try {
            const organizationId = await resolveActiveOrganizationId(ctx.session);
            if (!organizationId) {
                return NextResponse.json({ error: 'No organization found for user' }, { status: 400 });
            }

            const repositories = await getRepositories(
                provider,
                gitAccountId,
                ctx.session.user.id,
                organizationId,
            );
            return NextResponse.json(repositories);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to fetch repositories' },
                { status: 500 },
            );
        }
    });
