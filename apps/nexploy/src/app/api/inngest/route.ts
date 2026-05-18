import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { buildFunction } from '@/inngest/functions/build';
import { backupSchedulerAwsFunction } from '@/inngest/functions/backupSchedulerAws';
import { skipNodeFunction } from '@/inngest/functions/skipNode';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [buildFunction, backupSchedulerAwsFunction, skipNodeFunction],
});
