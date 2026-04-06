import { NextResponse } from 'next/server';
import { internalApiAuth, route } from '@/lib/api/nextRoute';
import {
    deleteBackupSchedulesByVolume,
    getBackupSchedulesForVolume,
} from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';

export const POST = route.use(internalApiAuth).handler(async (_, { body }) => {
    const { volumeName } = body;

    if (!volumeName || typeof volumeName !== 'string') {
        return NextResponse.json({ error: 'volumeName is required' }, { status: 400 });
    }

    const schedules = await getBackupSchedulesForVolume(volumeName);

    if (schedules.length === 0) {
        return NextResponse.json({ deleted: 0 });
    }

    await deleteBackupSchedulesByVolume(volumeName);

    await Promise.all(
        schedules.map((schedule) =>
            inngest.send({ name: 'backup/schedule.cancel', data: { id: schedule.id } }),
        ),
    );

    return NextResponse.json({ deleted: schedules.length });
});
