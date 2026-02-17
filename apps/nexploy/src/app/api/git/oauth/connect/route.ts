import { NextResponse } from 'next/server';
import { generateOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { route, authRouteServer } from '@/lib/api/nextRoute';

export const GET = route.use(authRouteServer).handler(async (request, { ctx }: any) => {
    const { searchParams } = new URL(request.url);
    const gitProviderId = searchParams.get('gitProviderId');

    if (!gitProviderId) {
        return NextResponse.json({ error: 'Missing gitProviderId' }, { status: 400 });
    }

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
        authUrl = `https://github.com/apps/${gitProvider.appName}/installations/new?${params.toString()}`;
    } else {
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state,
            scope: 'read_user read_repository api',
        });
        authUrl = `https://gitlab.com/oauth/authorize?${params.toString()}`;
    }

    return NextResponse.redirect(authUrl);
});
