import { NextResponse } from 'next/server';
import fs from 'fs';
import { route } from '@/lib/api/nextRoute';

const KEY_FILE = '/tmp/nexploy-api-key';

export const GET = route.handler(async (request: Request) => {
    const secret = request.headers.get('x-internal-secret');

    if (!secret || secret !== process.env.ENCRYPTION_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const key = fs.readFileSync(KEY_FILE, 'utf-8').trim();
        return NextResponse.json({ key });
    } catch {
        return NextResponse.json({ error: 'Key not available' }, { status: 503 });
    }
});
