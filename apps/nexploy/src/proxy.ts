import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminExist } from '@/services/auth/auth.service';
import { auth } from '@/lib/auth/auth';

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_ROUTES = ['/signin', '/2fa', '/2fa/backup-codes', '/setup'];

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

    const isNoAuthRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route));

    if (!hasAdmin) return path.startsWith('/setup') ? null : '/setup';
    if (!session) return isNoAuthRoute ? null : '/signin';
    if (isNoAuthRoute) return '/';
    if (isAdminRoute && session.user.role !== 'admin') return '/';

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
