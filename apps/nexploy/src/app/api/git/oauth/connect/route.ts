import { NextResponse } from 'next/server';
import { generateOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';
import { oauthConnectQuerySchema } from '@workspace/schemas-zod/git/gitAccount.schema';

export const GET = route
    .use(authRouteServer)
    .query(oauthConnectQuerySchema)
    .handler(
        async (
            _,
            { ctx, query }: { ctx: { session: Session }; query: { gitProviderId: string } },
        ) => {
            const { gitProviderId } = query;

            const gitProvider = await prisma.gitProvider.findUnique({
                where: { id: gitProviderId, enabled: true },
            });

            if (!gitProvider || !gitProvider.clientId || !gitProvider.clientSecret) {
                return NextResponse.json({ error: 'Provider not configured' }, { status: 400 });
            }

            const clientId = decrypt(gitProvider.clientId);
            const state = generateOAuthState({
                userId: ctx.session.user.id,
                provider: gitProvider.provider,
                gitProviderId: gitProvider.id,
            });

            const baseUrl = await getBaseUrl();
            const redirectUri = `${baseUrl}/api/git/oauth/callback`;

            let authUrl: string;

            if (gitProvider.provider === 'github') {
                const params = new URLSearchParams({ state });
                authUrl = `${gitProvider.baseUrl}/apps/${gitProvider.appName}/installations/new?${params.toString()}`;
            } else {
                const params = new URLSearchParams({
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    state,
                    scope: 'api read_api read_repository',
                });
                authUrl = `${gitProvider.baseUrl}/oauth/authorize?${params.toString()}`;
            }

            return NextResponse.redirect(authUrl);
        },
    );
