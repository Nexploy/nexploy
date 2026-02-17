import { NextResponse } from 'next/server';
import { getUserSession } from '@/services/auth/auth.service';
import { generateOAuthState } from '@/lib/oauth-state';
import { prisma } from '@/../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getBaseUrl } from '@/lib/getBaseUrl';

export async function GET(request: Request) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider || !['github', 'gitlab'].includes(provider)) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const gitProvider = await prisma.gitProvider.findFirst({
        where: { provider, enabled: true },
        orderBy: { createdAt: 'asc' },
    });

    if (!gitProvider || !gitProvider.clientId || !gitProvider.clientSecret) {
        return NextResponse.json({ error: 'Provider not configured' }, { status: 400 });
    }

    const clientId = decrypt(gitProvider.clientId);
    const state = generateOAuthState({
        userId: session.user.id,
        provider,
        gitProviderId: gitProvider.id,
    });

    const baseUrl = await getBaseUrl();
    const redirectUri = `${baseUrl}/api/git/oauth/callback`;

    let authUrl: string;

    if (provider === 'github') {
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
}
