import { NextResponse } from 'next/server';
import { verifyOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import dayjs from 'dayjs';
import { Session } from '@/lib/auth/auth';
import { githubExchangeCodeForToken, githubGetAuthenticatedUser } from '@/lib/api/github.api';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { oauthCallbackQuerySchema } from '@workspace/schemas-zod/git/gitAccount.schema';

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
                payload = verifyOAuthState(state);
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

            const clientId = decrypt(gitProvider.clientId);
            const clientSecret = decrypt(gitProvider.clientSecret);
            const redirectUri = `${origin}/api/git/oauth/callback`;

            try {
                let accessToken: string;
                let refreshToken: string | null = null;
                let expiresAt: Date | null = null;
                let providerAccountId: string;
                let providerUsername: string | null = null;

                if (payload.provider === 'github') {
                    const tokenData = await githubExchangeCodeForToken(
                        code,
                        clientId,
                        clientSecret,
                        redirectUri,
                    );
                    if (tokenData.error) {
                        return NextResponse.redirect(`${accountUrl}?error=token_exchange_failed`);
                    }

                    accessToken = tokenData.access_token;
                    refreshToken = tokenData.refresh_token ?? null;
                    if (tokenData.expires_in) {
                        expiresAt = dayjs().add(tokenData.expires_in, 'second').toDate();
                    }

                    const userData = await tokenGitStorage.run(
                        { accessToken, refreshToken, accessTokenExpiresAt: expiresAt },
                        async () => githubGetAuthenticatedUser(),
                    );

                    providerAccountId = String(userData.id);
                    providerUsername = userData.login;
                } else {
                    const body = new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code,
                        grant_type: 'authorization_code',
                        redirect_uri: redirectUri,
                    });

                    const tokenRes = await fetch(`${gitProvider.baseUrl}/oauth/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body,
                    });

                    const tokenData = await tokenRes.json();
                    if (tokenData.error) {
                        return NextResponse.redirect(`${accountUrl}?error=token_exchange_failed`);
                    }

                    accessToken = tokenData.access_token;
                    refreshToken = tokenData.refresh_token ?? null;
                    if (tokenData.expires_in) {
                        expiresAt = dayjs().add(tokenData.expires_in, 'second').toDate();
                    }

                    const userRes = await fetch(`${gitProvider.baseUrl}/api/v4/user`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    const userData = await userRes.json();

                    providerAccountId = String(userData.id);
                    providerUsername = userData.username;
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

                return NextResponse.redirect(`${accountUrl}?success=connected`);
            } catch (error) {
                return NextResponse.redirect(`${accountUrl}?error=connect_failed`);
            }
        },
    );
