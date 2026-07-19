import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import { route } from '@/lib/api/nextRoute';

const KEY_FILE = '/tmp/nexploy-api-key';

const matchesInternalSecret = (candidate: string) => {
    const expected = process.env.ENCRYPTION_KEY;

    if (!expected) return false;

    const candidateBuffer = Buffer.from(candidate);
    const expectedBuffer = Buffer.from(expected);

    if (candidateBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
};

const isAuthorized = async (request: Request) => {
    const internalSecret = request.headers.get('x-internal-secret');
    if (!internalSecret) return false;
    return matchesInternalSecret(internalSecret);
};

export const GET = route.handler(async (request: Request) => {
    if (!(await isAuthorized(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const key = fs.readFileSync(KEY_FILE, 'utf-8').trim();
        return NextResponse.json({ key });
    } catch {
        return NextResponse.json({ error: 'Key not available' }, { status: 503 });
    }
});
