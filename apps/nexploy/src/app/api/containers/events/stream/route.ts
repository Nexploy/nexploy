import { SSEProxy } from '@/services/docker/SSEProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const containerIds = searchParams.get('containers');

    return SSEProxy.createResponse(containerIds);
}
