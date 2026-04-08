import { inngest } from '@/inngest/client';
import { getNextRunAt, markScheduleRan } from '@/services/backupSchedule.service';
import { getAwsCredentials } from '@/services/aws.service';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { kyS3 } from '@/lib/api/kyS3';
import { tokenAwsStorage } from '@/lib/storage/token-aws-storage';

export const backupSchedulerAwsFunction = inngest.createFunction(
    {
        id: 'backup-schedule-run',
        retries: 2,
        cancelOn: [{ event: 'backup/schedule.cancel', match: 'data.id' }],
    },
    { event: 'backup/schedule.start' },
    async ({ event, step }) => {
        const {
            id,
            volumeName,
            environmentId,
            bucket,
            awsAccountId,
            frequency,
            scheduledHour = 0,
            scheduledMinute = 0,
            scheduledDay,
            nextRunAt,
        } = event.data;

        await step.sleepUntil('wait-until-scheduled', nextRunAt);

        const result = await step.run('do-backup', async () => {
            const creds = await getAwsCredentials(awsAccountId);

            const buffer = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, {
                    timeout: false,
                    environmentId,
                } as KyDockerOptions)
                .arrayBuffer();

            const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
            const url = `https://${bucket}.s3.${creds.region}.amazonaws.com/${objectKey}`;

            await tokenAwsStorage.run(creds, () =>
                kyS3.put(url, {
                    body: new Uint8Array(buffer),
                    headers: {
                        'Content-Type': 'application/gzip',
                        'Content-Length': String(buffer.byteLength),
                    },
                }),
            );

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
                awsAccountId,
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
