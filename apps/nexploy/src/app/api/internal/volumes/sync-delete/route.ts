import { NextResponse } from 'next/server';
import { internalApiAuth, route } from '@/lib/api/nextRoute';
import {
    deleteBackupSchedulesByVolume,
    getBackupSchedulesForVolume,
} from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';
import { syncVolumeDeleteSchema } from '@workspace/schemas-zod/s3/backupSchedule.schema';

export const POST = route
    .use(internalApiAuth({ service: 'docker-api' }))
    .body(syncVolumeDeleteSchema)
    .handler(async (_, { body }) => {
        const { volumeName } = body;

        const schedules = await getBackupSchedulesForVolume(volumeName);

        if (schedules.length === 0) {
            return NextResponse.json({ deleted: 0 });
        }

        await deleteBackupSchedulesByVolume(volumeName);

        await Promise.all(
            schedules.map((s) =>
                inngest.send({ name: 'backup/schedule.cancel', data: { id: s.id } }),
            ),
        );

        return NextResponse.json({ deleted: schedules.length });
    });
