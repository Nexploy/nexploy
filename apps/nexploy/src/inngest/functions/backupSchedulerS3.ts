import { inngest } from '@/inngest/client';
import { BackupScheduleStartEvent } from '@workspace/typescript-interface/s3/backupSchedule';
import { getNextRunAt, markScheduleRan } from '@/services/backupSchedule.service';
import { getS3Credentials } from '@/services/s3.service';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { createS3Client, putS3Object } from '@/lib/s3/s3';

export const backupSchedulerS3Function = inngest.createFunction(
    {
        id: 'backup-schedule-run',
        triggers: [{ event: 'backup/schedule.start' }],
        retries: 2,
        cancelOn: [
            {
                event: 'backup/schedule.cancel',
                if: 'event.data.id == async.data.id',
            },
        ],
    },
    async ({ event, step }) => {
        const {
            id,
            volumeName,
            environmentId,
            bucket,
            s3AccountId,
            frequency,
            scheduledHour = 0,
            scheduledMinute = 0,
            scheduledDay,
            nextRunAt,
        } = event.data as BackupScheduleStartEvent;

        await step.sleepUntil('wait-until-scheduled', nextRunAt);

        const result = await step.run('do-backup', async () => {
            const creds = await getS3Credentials(s3AccountId);

            const buffer = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, {
                    timeout: false,
                    environmentId,
                } as KyDockerOptions)
                .arrayBuffer();

            const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
            const s3 = createS3Client(creds);
            await putS3Object(s3, bucket, objectKey, new Uint8Array(buffer), 'application/gzip');

            await markScheduleRan(id);

            return { objectKey };
        });

        const nextAt = getNextRunAt(frequency, scheduledHour, scheduledMinute, scheduledDay);

        await step.sendEvent('reschedule', {
            name: 'backup/schedule.start',
            data: {
                id,
                volumeName,
                environmentId,
                bucket,
                s3AccountId,
                frequency,
                scheduledHour,
                scheduledMinute,
                scheduledDay,
                nextRunAt: nextAt.toISOString(),
            },
        });

        return result;
    },
);
