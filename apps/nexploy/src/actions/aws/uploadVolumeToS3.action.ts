'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { uploadVolumeToS3Schema } from '@workspace/schemas-zod/aws/aws.schema';
import { getAwsCredentials } from '@/services/aws.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { createS3Client, putS3Object } from '@/lib/aws/s3';
import { setToastServer } from '@/lib/toastServer';

export const uploadVolumeToS3Action = authActionServer
    .use(requirePermission('backup', 'create'))
    .inputSchema(uploadVolumeToS3Schema)
    .action(async ({ parsedInput }) => {
        try {
            const { volumeName, bucket, accountId } = parsedInput;
            const creds = await getAwsCredentials(accountId);
            const buffer = await kyDocker
                .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
                .arrayBuffer();

            const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
            const s3 = createS3Client(creds);
            await putS3Object(s3, bucket, objectKey, new Uint8Array(buffer), 'application/gzip');
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
