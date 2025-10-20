import { SSEProxy } from '@/services/docker/SSEProxy';
import { route } from '@/lib/api/nextRoute';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = route.handler(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const endpoint = queryParams.endpoint;
    if (!endpoint) return NextResponse.json('Missing "endpoint" query parameter', { status: 400 });

    delete queryParams.endpoint;

    return SSEProxy.createResponse({
        endpoint,
        queryParams,
    });
});
