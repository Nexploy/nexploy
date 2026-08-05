'use server';

import { purgeActivityLogsSchema } from '@workspace/schemas-zod/admin/activity.schema';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { purgeExpiredActivityLogs } from '@/services/activityLog.service';

export const purgeActivityLogsAction = authActionServer
    .metadata({ name: 'activity.purge' })
    .use(requirePermission('activity', 'manage'))
    .inputSchema(purgeActivityLogsSchema)
    .action(async () => {
        return purgeExpiredActivityLogs();
    });
