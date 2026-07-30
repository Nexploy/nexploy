import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readTraefikTree, resolveTraefikYmlPath } from '@/lib/traefik/fileTree';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('traefik', 'read'))
    .handler(async () => {
        const tree = await readTraefikTree();
        return NextResponse.json(tree);
    });

export const POST = route
    .use(authRouteServer)
    .use(requirePermission('traefik', 'manage'))
    .handler(async (_, { body }) => {
        const { filename, content } = body as { filename: string; content: string };

        const filePath = resolveTraefikYmlPath(filename);
        if (!filePath) {
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.invalidFilename') }, { status: 400 });
        }

        try {
            await fs.access(filePath);
            const t = await getErrorTranslator();
            return NextResponse.json({ message: t('api.fileAlreadyExists') }, { status: 409 });
        } catch {}

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content ?? '', 'utf-8');
        return NextResponse.json({ name: filename }, { status: 201 });
    });
