import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBackupSchedulesForVolume } from '@/services/backupSchedule.service';
import { backupSchedulesQuerySchema } from '@workspace/schemas-zod/aws/aws.schema';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .query(backupSchedulesQuerySchema)
    .handler(async (_, { query }) => {
        const schedules = await getBackupSchedulesForVolume(query.volume);
        return NextResponse.json(schedules);
    });
