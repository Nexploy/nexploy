import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageSaveQuerySchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('image', 'read'))
    .query(imageSaveQuerySchema)
    .handler(async (_request, { query }) => {
        const response = await kyDocker.post('images/save', { json: { imageIds: query.imageIds } });

        if (!response.body) {
            return NextResponse.json({ error: 'Failed to export the images' }, { status: 500 });
        }

        return new NextResponse(response.body, {
            headers: {
                'Content-Type': 'application/x-tar',
                'Content-Disposition': 'attachment; filename="images.tar"',
            },
        });
    });
