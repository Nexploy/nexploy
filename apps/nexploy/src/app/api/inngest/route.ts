import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { buildFunction } from '@/inngest/functions/build';
import { backupSchedulerBucketStorageFunction } from '@/inngest/functions/backupSchedulerBucketStorage';
import { dockerCleanupSchedulerFunction } from '@/inngest/functions/dockerCleanupScheduler';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [buildFunction, backupSchedulerBucketStorageFunction, dockerCleanupSchedulerFunction],
});
