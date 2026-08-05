import { inngest } from '@/inngest/client';
import { purgeExpiredActivityLogs } from '@/services/activityLog.service';

export const activityLogPurgeFunction = inngest.createFunction(
    {
        id: 'activity-log-purge',
        triggers: [{ cron: '0 4 * * *' }],
    },
    async ({ step }) => {
        const { purged } = await step.run('purge-expired-activity-logs', () => purgeExpiredActivityLogs());

        return { purged };
    },
);
