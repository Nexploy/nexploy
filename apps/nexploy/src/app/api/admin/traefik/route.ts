import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readTraefikTree, resolveTraefikYmlPath } from '@/lib/traefik/fileTree';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async () => {
        const tree = await readTraefikTree();
        return NextResponse.json(tree);
    });

export const POST = route
    .use(authRouteServer)
    .use(requirePermission('user', 'ban'))
    .handler(async (request) => {
        const body = await request.json();
        const { filename, content } = body as { filename: string; content: string };

        const filePath = resolveTraefikYmlPath(filename);
        if (!filePath) {
            return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });
        }

        try {
            await fs.access(filePath);
            return NextResponse.json({ message: 'File already exists' }, { status: 409 });
        } catch {}

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content ?? '', 'utf-8');
        return NextResponse.json({ name: filename }, { status: 201 });
    });
