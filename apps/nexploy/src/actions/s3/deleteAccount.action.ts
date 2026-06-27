'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { s3DeleteAccountSchema } from '@workspace/schemas-zod/s3/s3.schema';
import { deleteS3Account } from '@/services/s3.service';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const deleteS3AccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(s3DeleteAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteS3Account(parsedInput.id);
            revalidatePath('/admin/integrations');
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
