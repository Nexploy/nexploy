import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminExist } from '@/services/auth/auth.service';
import { RedirectRule } from '@workspace/typescript-interface/middleware';
import { auth } from '@/lib/auth/auth';

const handleI18nRouting = createMiddleware(routing);

const redirects: Record<string, string> = {
    '/': '/projects',
    '/docker': '/docker/containers',
};

function getRedirectUrl(pathname: string, baseUrl: string): URL | null {
    const redirectTarget = redirects[pathname];
    if (!redirectTarget) return null;

    const url = new URL(baseUrl);
    url.pathname = redirectTarget;
    return url;
}

async function checkRedirectRules(
    pathname: string,
    request: NextRequest,
    requestUrl: string,
): Promise<NextResponse | null> {
    const hasAdmin = await isAdminExist();

    const session = await auth.api.getSession({ headers: request.headers });

    const rules: RedirectRule[] = [
        {
            condition: !hasAdmin,
            targetPath: '/setup',
            shouldSkip: (path) => path.startsWith('/setup'),
        },
        {
            condition: !session,
            targetPath: '/signin',
            shouldSkip: (path) => path.startsWith('/signin'),
        },
    ];

    for (const rule of rules) {
        if (rule.condition && !rule.shouldSkip(pathname)) {
            return NextResponse.redirect(new URL(rule.targetPath, requestUrl));
        }
    }

    return null;
}

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const redirectRule = await checkRedirectRules(pathname, request, request.url);
    if (redirectRule) return redirectRule;

    const redirectUrl = getRedirectUrl(pathname, request.url);
    if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
    }

    return handleI18nRouting(request);
}

export const config = {
    runtime: 'nodejs',
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
