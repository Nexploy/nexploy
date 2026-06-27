'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createBackupScheduleSchema } from '@workspace/schemas-zod/s3/backupSchedule.schema';
import { createBackupSchedule } from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const createBackupScheduleAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(createBackupScheduleSchema)
    .action(async ({ parsedInput }) => {
        try {
            const {
                volumeName,
                bucket,
                s3AccountId,
                frequency,
                scheduledHour,
                scheduledMinute,
                scheduledDay,
            } = parsedInput;

            const schedule = await createBackupSchedule(
                volumeName,
                bucket,
                s3AccountId,
                frequency,
                scheduledHour,
                scheduledMinute,
                scheduledDay,
            );

            await inngest.send({
                name: 'backup/schedule.start',
                data: {
                    id: schedule.id,
                    volumeName: schedule.volumeName,
                    environmentId: schedule.environmentId ?? undefined,
                    bucket: schedule.bucket,
                    s3AccountId: schedule.s3AccountId,
                    frequency: schedule.frequency,
                    scheduledHour: schedule.scheduledHour,
                    scheduledMinute: schedule.scheduledMinute,
                    scheduledDay: schedule.scheduledDay ?? undefined,
                    nextRunAt: schedule.nextRunAt.toISOString(),
                },
            });

            revalidatePath('/admin/backups');
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
