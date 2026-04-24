import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminExist } from '@/services/auth/auth.service';
import { auth } from '@/lib/auth/auth';

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_ROUTES = ['/signin', '/2fa', '/2fa/backup-codes'];

const ADMIN_ROUTES = ['/admin'];

const SIMPLE_REDIRECTS: Record<string, string> = {
    '/': '/repositories',
    '/docker': '/docker/containers',
};

async function getRedirectUrl(request: NextRequest): Promise<string | null> {
    const path = request.nextUrl.pathname;

    if (SIMPLE_REDIRECTS[path]) return SIMPLE_REDIRECTS[path];

    const [hasAdmin, session] = await Promise.all([
        isAdminExist(),
        auth.api.getSession({ headers: request.headers }),
    ]);

    const setupRoute = path.startsWith('/setup');
    const publicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));
    const adminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route));

    // No admin yet: only /setup is accessible
    if (!hasAdmin) return setupRoute ? null : '/setup';

    // /setup is no longer accessible once admin is created
    if (setupRoute) return '/';

    // No session: only public routes are accessible
    if (!session) return publicRoute ? null : '/signin';

    // Authenticated: public routes redirect to the app
    if (publicRoute) return '/';

    // Admin routes are restricted to admins
    if (adminRoute && session.user.role !== 'admin') return '/';

    return null;
}

export default async function middleware(request: NextRequest) {
    const redirectUrl = await getRedirectUrl(request);

    if (redirectUrl) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return handleI18nRouting(request);
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
