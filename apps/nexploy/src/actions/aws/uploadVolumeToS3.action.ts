'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { uploadVolumeToS3Schema } from '@workspace/schemas-zod/aws/aws.schema';
import { getAwsCredentials } from '@/services/aws.service';
import { kyDocker } from '@/lib/api/kyDocker';
import { kyS3 } from '@/lib/api/kyS3';
import { tokenAwsStorage } from '@/lib/storage/token-aws-storage';
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
            const url = `https://${bucket}.s3.${creds.region}.amazonaws.com/${objectKey}`;

            await tokenAwsStorage.run(creds, () =>
                kyS3.put(url, {
                    body: new Uint8Array(buffer),
                    headers: {
                        'Content-Type': 'application/gzip',
                        'Content-Length': String(buffer.byteLength),
                    },
                }),
            );
            return { objectKey };
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
