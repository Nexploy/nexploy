import { NextResponse } from 'next/server';
import { verifyOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';
import { oauthCallbackQuerySchema } from '@workspace/schemas-zod/git/gitAccount.schema';
import { getGitAdapter, isSupportedGitProvider } from '@/services/git/core/registry';
import { GIT_OAUTH_EXCHANGE_FAILED } from '@/services/git/providers/github/github.adapter';

export const GET = route
    .use(authRouteServer)
    .query(oauthCallbackQuerySchema)
    .handler(
        async (
            _,
            { ctx, query }: { ctx: { session: Session }; query: { code?: string; state?: string } },
        ) => {
            const { code, state } = query;
            const origin = await getBaseUrl();
            const accountUrl = `${origin}/account`;

            if (!code || !state) {
                return NextResponse.redirect(`${accountUrl}?error=missing_params`);
            }

            let payload;
            try {
                payload = await verifyOAuthState(state);
            } catch {
                return NextResponse.redirect(`${accountUrl}?error=invalid_state`);
            }

            if (ctx.session.user.id !== payload.userId) {
                return NextResponse.redirect(`${accountUrl}?error=unauthorized`);
            }

            const gitProvider = await prisma.gitProvider.findUnique({
                where: { id: payload.gitProviderId },
            });

            if (!gitProvider || !gitProvider.clientId || !gitProvider.clientSecret) {
                return NextResponse.redirect(`${accountUrl}?error=provider_not_found`);
            }

            if (!isSupportedGitProvider(payload.provider)) {
                return NextResponse.redirect(`${accountUrl}?error=unsupported_provider`);
            }

            const clientId = decrypt(gitProvider.clientId);
            const clientSecret = decrypt(gitProvider.clientSecret);
            const redirectUri = `${origin}/api/git/oauth/callback`;

            try {
                let accessToken: string;
                let refreshToken: string | null = null;
                let expiresAt: Date | null = null;
                let providerAccountId: string;
                let providerUsername: string | null = null;

                try {
                    const result = await getGitAdapter(payload.provider).exchangeCodeForToken({
                        code,
                        credentials: {
                            clientId,
                            clientSecret,
                            baseUrl: gitProvider.baseUrl ?? undefined,
                        },
                        redirectUri,
                    });
                    accessToken = result.accessToken;
                    refreshToken = result.refreshToken;
                    expiresAt = result.accessTokenExpiresAt;
                    providerAccountId = result.providerAccountId;
                    providerUsername = result.providerUsername;
                } catch (exchangeError) {
                    if (
                        exchangeError instanceof Error &&
                        exchangeError.message === GIT_OAUTH_EXCHANGE_FAILED
                    ) {
                        return NextResponse.redirect(`${accountUrl}?error=token_exchange_failed`);
                    }
                    throw exchangeError;
                }

                await prisma.gitAccount.upsert({
                    where: {
                        userId_gitProviderId: {
                            userId: payload.userId,
                            gitProviderId: payload.gitProviderId,
                        },
                    },
                    update: {
                        accessToken: encrypt(accessToken),
                        refreshToken: refreshToken ? encrypt(refreshToken) : null,
                        accessTokenExpiresAt: expiresAt,
                        providerAccountId,
                        providerUsername,
                    },
                    create: {
                        userId: payload.userId,
                        gitProviderId: payload.gitProviderId,
                        provider: payload.provider,
                        providerAccountId,
                        providerUsername,
                        accessToken: encrypt(accessToken),
                        refreshToken: refreshToken ? encrypt(refreshToken) : null,
                        accessTokenExpiresAt: expiresAt,
                    },
                });

                return NextResponse.redirect(`${accountUrl}#integrations`);
            } catch (error) {
                return NextResponse.redirect(`${accountUrl}#integrations`);
            }
        },
    );
