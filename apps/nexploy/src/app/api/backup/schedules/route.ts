import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBackupSchedulesForVolume } from '@/services/backupSchedule.service';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .handler(async (request) => {
        const { searchParams } = new URL(request.url);
        const volumeName = searchParams.get('volume');

        if (!volumeName) {
            return NextResponse.json({ error: 'volume parameter is required' }, { status: 400 });
        }

        const schedules = await getBackupSchedulesForVolume(volumeName);
        return NextResponse.json(schedules);
    });
