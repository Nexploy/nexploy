'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { bucketStorageAddAccountSchema } from '@workspace/schemas-zod/bucket-storage/bucketStorage.schema';
import { saveBucketStorageAccount } from '@/services/bucketStorage.service';
import { verifyBucketStorageCredentials } from '@/lib/bucket-storage/bucketStorage';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const addBucketStorageAccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(bucketStorageAddAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, accessKeyId, secretAccessKey, region, endpoint } = parsedInput;
            await verifyBucketStorageCredentials({ accessKeyId, secretAccessKey, region, endpoint });
            await saveBucketStorageAccount(displayName, accessKeyId, secretAccessKey, region, endpoint);
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
