import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { buildFunction } from '@/inngest/functions/build';
import { backupSchedulerBucketStorageFunction } from '@/inngest/functions/backupSchedulerBucketStorage';
import { dockerCleanupSchedulerFunction } from '@/inngest/functions/dockerCleanupScheduler';
import { activityLogPurgeFunction } from '@/inngest/functions/activityLogPurge';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        buildFunction,
        backupSchedulerBucketStorageFunction,
        dockerCleanupSchedulerFunction,
        activityLogPurgeFunction,
    ],
});
