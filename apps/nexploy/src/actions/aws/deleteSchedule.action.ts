'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteBackupScheduleSchema } from '@workspace/schemas-zod/aws/backupSchedule.schema';
import { deleteBackupSchedule } from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';

export const deleteBackupScheduleAction = authActionServer
    .use(requirePermission('backup', 'delete'))
    .inputSchema(deleteBackupScheduleSchema)
    .action(async ({ parsedInput }) => {
        await deleteBackupSchedule(parsedInput.id);

        await inngest.send({
            name: 'backup/schedule.cancel',
            data: { id: parsedInput.id },
        });

        return { success: true };
    });
