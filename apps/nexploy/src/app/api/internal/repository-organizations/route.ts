import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { route } from '@/lib/api/nextRoute';
import { prisma } from '../../../../../prisma/prisma';
import type { RepositoryOrganizations } from '@nexploy/shared/ownership';

const matchesInternalSecret = (candidate: string) => {
    const expected = process.env.ENCRYPTION_KEY;

    if (!expected) return false;

    const candidateBuffer = Buffer.from(candidate);
    const expectedBuffer = Buffer.from(expected);

    if (candidateBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
};

const isAuthorized = (request: Request) => {
    const internalSecret = request.headers.get('x-internal-secret');
    if (!internalSecret) return false;
    return matchesInternalSecret(internalSecret);
};

export const GET = route.handler(async (request: Request) => {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repositories = await prisma.repository.findMany({
        select: { id: true, organizationId: true },
    });

    const map: RepositoryOrganizations = {};
    for (const repository of repositories) {
        map[repository.id] = repository.organizationId;
    }

    return NextResponse.json(map);
});
