import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminExist } from '@/services/auth/auth.service';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PermissionResource } from '@/lib/auth/permissions';

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_ROUTES = ['/signin', '/2fa', '/2fa/backup-codes'];

const SIMPLE_REDIRECTS: Record<string, string> = {
    '/': '/repositories',
    '/docker': '/docker/containers',
    '/admin/ai': '/admin/ai/models',
};

const PERMISSION_ROUTES: { path: string; resource: PermissionResource; action: string }[] = [
    { path: '/repositories/create', resource: 'repository', action: 'create' },
    { path: '/docker/containers/stacks/create', resource: 'container', action: 'manage' },
    { path: '/docker/containers/create', resource: 'container', action: 'manage' },
    { path: '/docker/images/pull', resource: 'image', action: 'pull' },
    { path: '/docker/volumes/create', resource: 'volume', action: 'manage' },
    { path: '/docker/networks/create', resource: 'network', action: 'manage' },
    { path: '/swarm/services/create', resource: 'swarm', action: 'manage' },
    { path: '/admin/users', resource: 'user', action: 'update' },
    { path: '/admin/integrations', resource: 'gitProvider', action: 'create' },
    { path: '/admin/ai', resource: 'ai', action: 'manage' },
    { path: '/admin/backups', resource: 'backup', action: 'read' },
    { path: '/admin/ssl-certificates', resource: 'ssl', action: 'manage' },
    { path: '/admin/registry', resource: 'registry', action: 'read' },
    { path: '/admin/settings', resource: 'setting', action: 'manage' },
    { path: '/admin/traefik', resource: 'traefik', action: 'manage' },
];

async function getRedirectUrl(request: NextRequest): Promise<string | NextResponse | null> {
    const path = request.nextUrl.pathname;

    if (SIMPLE_REDIRECTS[path]) return SIMPLE_REDIRECTS[path];

    const [hasAdmin, session] = await Promise.all([
        isAdminExist(),
        auth.api.getSession({ headers: request.headers }),
    ]);

    const setupRoute = path.startsWith('/setup');
    const publicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));

    if (!hasAdmin) return setupRoute ? null : '/setup';
    if (setupRoute) return '/';
    if (!session) return publicRoute ? null : '/signin';
    if (publicRoute) return '/';

    const role = session.user.role ?? '';
    for (const route of PERMISSION_ROUTES) {
        if (path.startsWith(route.path) && !hasPermission(role, route.resource, route.action)) {
            return NextResponse.rewrite(new URL('/_not-found', request.url));
        }
    }

    return null;
}

export default async function middleware(request: NextRequest) {
    const result = await getRedirectUrl(request);

    if (result instanceof NextResponse) return result;

    if (result) return NextResponse.redirect(new URL(result, request.url));

    return handleI18nRouting(request);
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|_ws|.*\\..*).*)',
};
