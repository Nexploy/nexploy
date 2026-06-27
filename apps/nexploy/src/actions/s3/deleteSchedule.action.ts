'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteBackupScheduleSchema } from '@workspace/schemas-zod/s3/backupSchedule.schema';
import { deleteBackupSchedule } from '@/services/backupSchedule.service';
import { inngest } from '@/inngest/client';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const deleteBackupScheduleAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(deleteBackupScheduleSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteBackupSchedule(parsedInput.id);
            await inngest.send({
                name: 'backup/schedule.cancel',
                data: { id: parsedInput.id },
            });
            revalidatePath('/admin/backups');
        } catch (err: any) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message,
                });
            }
            throw err;
        }
    });
