import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import * as path from 'path';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async () => {
        await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
        const entries = await fs.readdir(TRAEFIK_SERVICE_DIR, { withFileTypes: true });
        const files = entries
            .filter((e) => e.isFile() && e.name.endsWith('.yml'))
            .map((e) => ({ name: e.name }));
        return NextResponse.json(files);
    });

export const POST = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (request) => {
        const body = await request.json();
        const { filename, content } = body as { filename: string; content: string };

        if (!filename || !/^[\w.-]+\.yml$/.test(filename)) {
            return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });
        }

        const filePath = path.join(TRAEFIK_SERVICE_DIR, filename);

        try {
            await fs.access(filePath);
            return NextResponse.json({ message: 'File already exists' }, { status: 409 });
        } catch {}

        await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
        await fs.writeFile(filePath, content ?? '', 'utf-8');
        return NextResponse.json({ name: filename }, { status: 201 });
    });
