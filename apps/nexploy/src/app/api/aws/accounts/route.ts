import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getAllAwsAccounts } from '@/services/aws.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .handler(async () => {
        const accounts = await getAllAwsAccounts();
        return NextResponse.json(accounts);
    });
