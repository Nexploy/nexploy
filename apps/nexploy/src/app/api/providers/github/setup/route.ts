import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveGitHubApp } from '@/services/oauthProvider.service';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/lib/toastServer';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { githubExchangeManifestCode } from '@/lib/api/github.api';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('gitProvider', 'create'))
    .handler(async (request) => {
        const baseUrl = await getBaseUrl();
        const redirectTo = (path: string) => NextResponse.redirect(`${baseUrl}${path}`);

        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        if (!code) {
            await setToastServer({ type: 'error', message: 'Missing code from GitHub' });
            return redirectTo('/admin/integrations');
        }

        const cookieStore = await cookies();
        const displayNameCookie = cookieStore.get('github_app_display_name')?.value;
        const displayName = displayNameCookie ? decodeURIComponent(displayNameCookie) : 'GitHub';

        let data;
        try {
            data = await githubExchangeManifestCode(code);
        } catch (error) {
            await setToastServer({ type: 'error', message: 'GitHub App creation failed' });
            return redirectTo('/admin/integrations');
        }

        await saveGitHubApp({
            displayName,
            appId: String(data.id),
            appName: data.slug ?? data.name,
            clientId: data.client_id,
            clientSecret: data.client_secret,
            webhookSecret: data.webhook_secret,
            privateKey: data.pem,
            ownerName: data.owner?.login,
            ownerType: data.owner?.type,
        });

        cookieStore.delete('github_app_display_name');

        await setToastServer({ type: 'success', message: 'GitHub App configured successfully' });
        return redirectTo('/admin/integrations');
    });
