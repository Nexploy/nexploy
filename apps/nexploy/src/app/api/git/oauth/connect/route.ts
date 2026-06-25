import { NextResponse } from 'next/server';
import { generateOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { Session } from '@/lib/auth/auth';
import { oauthConnectQuerySchema } from '@workspace/schemas-zod/git/gitAccount.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getGitAdapter, isSupportedGitProvider } from '@/services/git/core/registry';

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
                const t = await getErrorTranslator();
                return NextResponse.json({ error: t('api.providerNotConfigured') }, { status: 400 });
            }

            if (!isSupportedGitProvider(gitProvider.provider)) {
                const t = await getErrorTranslator();
                return NextResponse.json({ error: t('api.unsupportedProvider') }, { status: 400 });
            }

            const clientId = decrypt(gitProvider.clientId);
            const state = generateOAuthState({
                userId: ctx.session.user.id,
                provider: gitProvider.provider,
                gitProviderId: gitProvider.id,
            });

            const baseUrl = await getBaseUrl();
            const redirectUri = `${baseUrl}/api/git/oauth/callback`;

            const authUrl = getGitAdapter(gitProvider.provider).buildAuthorizeUrl({
                credentials: {
                    clientId,
                    clientSecret: decrypt(gitProvider.clientSecret),
                    appName: gitProvider.appName ?? undefined,
                    baseUrl: gitProvider.baseUrl ?? undefined,
                },
                state,
                redirectUri,
            });

            return NextResponse.redirect(authUrl);
        },
    );
