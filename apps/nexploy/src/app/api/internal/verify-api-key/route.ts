import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { route } from '@/lib/api/nextRoute';
import { auth } from '@/lib/auth/auth';

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

export const POST = route.handler(async (request: Request, { body }) => {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = body as { key?: string };
    if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const result = await auth.api.verifyApiKey({ body: { key } });

    return NextResponse.json({ valid: result.valid });
});
