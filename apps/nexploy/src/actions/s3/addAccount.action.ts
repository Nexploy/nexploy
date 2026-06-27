'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { s3AddAccountSchema } from '@workspace/schemas-zod/s3/s3.schema';
import { saveS3Account } from '@/services/s3.service';
import { verifyS3Credentials } from '@/lib/s3/s3';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const addS3AccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(s3AddAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, accessKeyId, secretAccessKey, region, endpoint } = parsedInput;
            await verifyS3Credentials({ accessKeyId, secretAccessKey, region, endpoint });
            await saveS3Account(displayName, accessKeyId, secretAccessKey, region, endpoint);
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
