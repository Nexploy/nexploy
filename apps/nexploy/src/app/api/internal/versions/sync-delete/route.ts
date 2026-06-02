import { NextResponse } from 'next/server';
import { internalApiAuth, route } from '@/lib/api/nextRoute';
import { syncVersionDeleteSchema } from '@workspace/schemas-zod/repository/version.schema';
import { deleteVersionsByImageTag } from '@/services/repository/version.service';

export const POST = route
    .use(internalApiAuth({ service: 'docker-api' }))
    .body(syncVersionDeleteSchema)
    .handler(async (_, { body }) => {
        const { repositoryId, imageTag } = body;
        const deleted = await deleteVersionsByImageTag(repositoryId, imageTag);
        return NextResponse.json({ deleted });
    });
