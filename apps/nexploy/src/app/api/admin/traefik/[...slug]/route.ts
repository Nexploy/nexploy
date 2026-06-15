import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import { resolveTraefikYmlPath } from '@/lib/traefik/fileTree';

function relPath(slug: string[]): string {
    return slug.map((s) => decodeURIComponent(s)).join('/');
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (_request, { params }) => {
        const { slug } = await params;
        const name = relPath(slug);
        const filePath = resolveTraefikYmlPath(name);
        if (!filePath) return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return NextResponse.json({ name, content });
        } catch {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }
    });

export const DELETE = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (_request, { params }) => {
        const { slug } = await params;
        const filePath = resolveTraefikYmlPath(relPath(slug));
        if (!filePath) return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });

        try {
            await fs.unlink(filePath);
        } catch {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    });
