import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAllBucketStorageAccounts } from '@/services/bucketStorage.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('cloudBackup', 'read'))
    .handler(async () => {
        const accounts = await getAllBucketStorageAccounts();
        return NextResponse.json(accounts);
    });
