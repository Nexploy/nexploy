import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import * as path from 'path';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

function safePath(filename: string): string | null {
    if (!/^[\w.-]+\.yml$/.test(filename)) return null;
    return path.join(TRAEFIK_SERVICE_DIR, filename);
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (_request, { params }) => {
        const { filename } = await params;
        const filePath = safePath(filename);
        if (!filePath) return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return NextResponse.json({ name: filename, content });
        } catch {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }
    });

export const DELETE = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (_request, { params }) => {
        const { filename } = await params;
        const filePath = safePath(filename);
        if (!filePath) return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });

        try {
            await fs.unlink(filePath);
        } catch {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    });
