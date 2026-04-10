import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getRegistryWithPassword } from '@/services/registry.service';
import { idParamSchema } from '@workspace/schemas-zod/api/params.schema';
import { kyRegistry } from '@/lib/api/kyRegistry';

export interface RegistryImage {
    name: string;
    tags: string[];
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('registry', 'read'))
    .params(idParamSchema)
    .handler(async (_, { params }) => {
        const { id } = params;

        const registry = await getRegistryWithPassword(id);
        if (!registry) {
            return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
        }

        try {
            const { repositories = [] } = await kyRegistry({
                url: registry.url,
                username: registry.username,
                password: registry.password,
            })
                .get('_catalog', { searchParams: { n: 200 } })
                .json<{ repositories: string[] }>();

            const images: RegistryImage[] = await Promise.all(
                repositories.map(async (name) => {
                    try {
                        const { tags = [] } = await kyRegistry({
                            url: registry.url,
                            username: registry.username,
                            password: registry.password,
                        })
                            .get(`${name}/tags/list`)
                            .json<{ tags: string[] }>();
                        return { name, tags: tags ?? [] };
                    } catch {
                        return { name, tags: [] };
                    }
                }),
            );

            return NextResponse.json(images);
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Failed to connect to registry' },
                { status: 500 },
            );
        }
    });
