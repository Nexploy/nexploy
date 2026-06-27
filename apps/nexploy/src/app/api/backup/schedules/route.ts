import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getBackupSchedulesForVolume } from '@/services/backupSchedule.service';
import { backupSchedulesQuerySchema } from '@workspace/schemas-zod/bucket-storage/bucketStorage.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('backup', 'read'))
    .query(backupSchedulesQuerySchema)
    .handler(async (_, { query }) => {
        try {
            const schedules = await getBackupSchedulesForVolume(query.volume);
            return NextResponse.json(schedules);
        } catch {
            await setToastServer({
                type: 'error',
                message: 'Error while fetching backup schedules',
            });
            return;
        }
    });
