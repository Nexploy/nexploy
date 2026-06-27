import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { buildFunction } from '@/inngest/functions/build';
import { backupSchedulerS3Function } from '@/inngest/functions/backupSchedulerS3';
import { dockerCleanupSchedulerFunction } from '@/inngest/functions/dockerCleanupScheduler';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [buildFunction, backupSchedulerS3Function, dockerCleanupSchedulerFunction],
});
