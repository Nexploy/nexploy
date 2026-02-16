import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { saveGitHubApp } from '@/services/oauthProvider.service';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { getUserSession } from '@/services/auth/auth.service';

async function getBaseUrl() {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
}

export const GET = route.use(authRouteServer).handler(async (request) => {
    const baseUrl = await getBaseUrl();
    const redirectTo = (path: string) => NextResponse.redirect(`${baseUrl}${path}`);

    const session = await getUserSession();
    if (!session || session.user.role !== 'admin') {
        await setToastServer({ type: 'error', message: 'Only admins can configure Git providers' });
        return redirectTo('/admin/integrations');
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
        await setToastServer({ type: 'error', message: 'Missing code from GitHub' });
        return redirectTo('/admin/integrations');
    }

    const cookieStore = await cookies();
    const displayNameCookie = cookieStore.get('github_app_display_name')?.value;
    const displayName = displayNameCookie ? decodeURIComponent(displayNameCookie) : 'GitHub';

    const response = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
        method: 'POST',
        headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub App manifest exchange failed:', errorText);
        await setToastServer({ type: 'error', message: 'GitHub App creation failed' });
        return redirectTo('/admin/integrations');
    }

    const data = await response.json();

    await saveGitHubApp({
        displayName,
        appId: String(data.id),
        appName: data.slug ?? data.name,
        clientId: data.client_id,
        clientSecret: data.client_secret,
        webhookSecret: data.webhook_secret,
        privateKey: data.pem,
    });

    cookieStore.delete('github_app_display_name');

    await setToastServer({ type: 'success', message: 'GitHub App configured successfully' });
    return redirectTo('/admin/integrations');
});
