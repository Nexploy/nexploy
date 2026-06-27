'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { uploadVolumeToBucketStorageSchema } from '@workspace/schemas-zod/bucket-storage/bucketStorage.schema';
import { getBucketStorageCredentials } from '@/services/bucketStorage.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { createBucketStorageClient, putBucketStorageObject } from '@/lib/bucket-storage/bucketStorage';
import { setToastServer } from '@/lib/toastServer';

export const uploadVolumeToBucketStorageAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(uploadVolumeToBucketStorageSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { volumeName, bucket, accountId } = parsedInput;
            const creds = await getBucketStorageCredentials(accountId);
            const buffer = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
                .arrayBuffer();

            const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
            const client = createBucketStorageClient(creds);
            await putBucketStorageObject(client, bucket, objectKey, new Uint8Array(buffer), 'application/gzip');
            return { objectKey };
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
