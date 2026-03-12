import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { prisma } from '../../../../../../prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { kyRegistry } from '@/lib/api/kyRegistry';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('registry', 'read'))
    .handler(async (_, { params }: { params: Promise<{ id: string }> }) => {
        const { id } = await params;

        const registry = await prisma.dockerRegistry.findUnique({
            where: { id },
            select: { url: true, username: true, password: true },
        });

        if (!registry) {
            return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
        }

        const auth = registry.username
            ? {
                  username: registry.username,
                  password: registry.password ? decrypt(registry.password) : '',
              }
            : undefined;

        try {
            const catalog = await kyRegistry(registry.url, auth)
                .get('v2/_catalog')
                .json<{ repositories: string[] }>();
            const repositories = catalog?.repositories ?? [];

            const images = await Promise.all(
                repositories.map(async (name) => {
                    try {
                        const result = await kyRegistry(registry.url, auth)
                            .get(`v2/${name}/tags/list`)
                            .json<{ tags: string[] }>();
                        return { name, tags: result?.tags ?? [] };
                    } catch {
                        return { name, tags: [] };
                    }
                }),
            );

            return NextResponse.json({ images });
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to fetch registry images' },
                { status: 500 },
            );
        }
    });
