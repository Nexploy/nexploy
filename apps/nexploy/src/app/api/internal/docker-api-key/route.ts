import { NextResponse } from 'next/server';
import fs from 'fs';

const KEY_FILE = '/tmp/nexploy-api-key';

export async function GET(request: Request) {
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
}
