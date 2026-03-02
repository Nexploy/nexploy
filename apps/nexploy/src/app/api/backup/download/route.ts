import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserSession } from '@/services/auth/auth.service';
import { kyDocker } from '@/lib/api/kyDocker';

export async function GET(request: Request) {
    const session = await getUserSession(await headers());
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const volumeName = searchParams.get('volume');

    if (!volumeName) {
        return NextResponse.json({ error: 'volume parameter is required' }, { status: 400 });
    }

    const buffer = await kyDocker
        .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
        .arrayBuffer();

    const filename = `${volumeName}-${Date.now()}.tar.gz`;

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(buffer.byteLength),
        },
    });
}
