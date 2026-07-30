import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

function relPath(slug: string[]): string {
    return slug.map((s) => decodeURIComponent(s)).join('/');
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('traefik', 'read'))
    .handler(async (_request, { params }) => {
        const { slug } = await params;
        const name = relPath(slug);
        const filePath = resolveTraefikYmlPath(name);
        if (!filePath) {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.invalidFilename') }, { status: 400 });
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return NextResponse.json({ name, content });
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.fileNotFound') }, { status: 404 });
        }
    });

export const DELETE = route
    .use(authRouteServer)
    .use(requirePermission('traefik', 'manage'))
    .handler(async (_request, { params }) => {
        const { slug } = await params;
        const filePath = resolveTraefikYmlPath(relPath(slug));
        if (!filePath) {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.invalidFilename') }, { status: 400 });
        }

        try {
            await fs.unlink(filePath);
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.fileNotFound') }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    });
