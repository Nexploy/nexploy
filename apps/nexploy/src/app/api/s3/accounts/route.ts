import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAllS3Accounts } from '@/services/s3.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('cloudBackup', 'read'))
    .handler(async () => {
        const accounts = await getAllS3Accounts();
        return NextResponse.json(accounts);
    });
