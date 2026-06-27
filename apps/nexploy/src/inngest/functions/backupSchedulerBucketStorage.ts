import { inngest } from '@/inngest/client';
import { BackupScheduleStartEvent } from '@workspace/typescript-interface/bucket-storage/backupSchedule';
import { getNextRunAt, markScheduleRan } from '@/services/backupSchedule.service';
import { getBucketStorageCredentials } from '@/services/bucketStorage.service';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { createBucketStorageClient, putBucketStorageObject } from '@/lib/bucket-storage/bucketStorage';

export const backupSchedulerBucketStorageFunction = inngest.createFunction(
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
            bucketStorageAccountId,
            frequency,
            scheduledHour = 0,
            scheduledMinute = 0,
            scheduledDay,
            nextRunAt,
        } = event.data as BackupScheduleStartEvent;

        await step.sleepUntil('wait-until-scheduled', nextRunAt);

        const result = await step.run('do-backup', async () => {
            const creds = await getBucketStorageCredentials(bucketStorageAccountId);

            const buffer = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, {
                    timeout: false,
                    environmentId,
                } as KyDockerOptions)
                .arrayBuffer();

            const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
            const client = createBucketStorageClient(creds);
            await putBucketStorageObject(client, bucket, objectKey, new Uint8Array(buffer), 'application/gzip');

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
                bucketStorageAccountId,
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
