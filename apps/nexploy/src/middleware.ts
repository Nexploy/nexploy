import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    const response = handleI18nRouting(request);
    const { pathname } = request.nextUrl;

    if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/projects';
        return NextResponse.redirect(url);
    }

    return response
}


export const config = {

    // Match all pathnames except for
    // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
