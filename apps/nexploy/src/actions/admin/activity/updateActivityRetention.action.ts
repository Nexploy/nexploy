'use server';

import { activityRetentionSchema } from '@workspace/schemas-zod/admin/activity.schema';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateActivityRetention } from '@/services/activityLog.service';

export const updateActivityRetentionAction = authActionServer
    .metadata({ name: 'activity.updateRetention' })
    .use(requirePermission('activity', 'manage'))
    .inputSchema(activityRetentionSchema)
    .action(async ({ parsedInput: { retentionDays } }) => {
        return await updateActivityRetention(retentionDays);
    });
