'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { createBackupScheduleSchema } from '@workspace/schemas-zod/aws/backupSchedule.schema';
import { createBackupSchedule } from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';

export const createBackupScheduleAction = authActionServer
    .use(requirePermission('backup', 'create'))
    .inputSchema(createBackupScheduleSchema)
    .action(async ({ parsedInput }) => {
        const { volumeName, bucket, awsAccountId, frequency } = parsedInput;
        const schedule = await createBackupSchedule(volumeName, bucket, awsAccountId, frequency);

        await inngest.send({
            name: 'backup/schedule.start',
            data: {
                id: schedule.id,
                volumeName: schedule.volumeName,
                bucket: schedule.bucket,
                awsAccountId: schedule.awsAccountId,
                frequency: schedule.frequency,
                nextRunAt: schedule.nextRunAt.toISOString(),
            },
        });

        return schedule;
    });
