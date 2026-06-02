import { NextResponse } from 'next/server';
import fs from 'fs';
import { route } from '@/lib/api/nextRoute';
import { auth } from '@/lib/auth/auth';

const KEY_FILE = '/tmp/nexploy-api-key';

export const GET = route.handler(async (request: Request) => {
    const apiKeyHeader = request.headers.get('x-api-key');

    if (!apiKeyHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await auth.api.verifyApiKey({
        body: { key: apiKeyHeader },
    });

    if (!result.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const key = fs.readFileSync(KEY_FILE, 'utf-8').trim();
        return NextResponse.json({ key });
    } catch {
        return NextResponse.json({ error: 'Key not available' }, { status: 503 });
    }
});
