import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminExist } from '@/services/auth/auth.service';
import { auth } from '@/lib/auth/auth';
import { RedirectRule } from '@workspace/typescript-interface/middleware';

const handleI18nRouting = createMiddleware(routing);

const redirects: Record<string, string> = {
    '/': '/projects',
    '/docker': '/docker/containers',
};

async function checkRedirectRules(request: NextRequest): Promise<NextResponse | null> {
    const [hasAdmin, session] = await Promise.all([
        isAdminExist(),
        auth.api.getSession({ headers: request.headers }),
    ]);

    const path = request.nextUrl.pathname;

    const rules: RedirectRule[] = [
        {
            condition: !hasAdmin,
            shouldSkip: (path) => !path.startsWith('/setup'),
            targetPath: '/setup',
        },
        {
            condition: hasAdmin,
            shouldSkip: (path) => path.startsWith('/setup'),
            targetPath: '/',
        },
        {
            condition: !session,
            shouldSkip: (path) => !path.startsWith('/signin'),
            targetPath: '/signin',
        },
        {
            condition: !!session,
            shouldSkip: (path) => path.startsWith('/signin'),
            targetPath: '/',
        },
    ];

    for (const rule of rules) {
        if (rule.condition && rule.shouldSkip(path)) {
            return NextResponse.redirect(new URL(rule.targetPath, request.url));
        }
    }

    const redirectTarget = redirects[path];
    if (redirectTarget) {
        const url = new URL(redirectTarget, request.url);
        return NextResponse.redirect(url);
    }

    return null;
}

export default async function middleware(request: NextRequest) {
    const redirectResponse = await checkRedirectRules(request);
    if (redirectResponse) return redirectResponse;

    return handleI18nRouting(request);
}

export const config = {
    runtime: 'nodejs',
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
