'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteBackupScheduleSchema } from '@workspace/schemas-zod/aws/backupSchedule.schema';
import { deleteBackupSchedule } from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const deleteBackupScheduleAction = authActionServer
    .use(requirePermission('backup', 'delete'))
    .inputSchema(deleteBackupScheduleSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteBackupSchedule(parsedInput.id);
            await inngest.send({
                name: 'backup/schedule.cancel',
                data: { id: parsedInput.id },
            });
            revalidatePath('/admin/backups');
        } catch (error: any) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
