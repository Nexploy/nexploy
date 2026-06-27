'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { bucketStorageDeleteAccountSchema } from '@workspace/schemas-zod/bucket-storage/bucketStorage.schema';
import { deleteBucketStorageAccount } from '@/services/bucketStorage.service';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const deleteBucketStorageAccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(bucketStorageDeleteAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteBucketStorageAccount(parsedInput.id);
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
