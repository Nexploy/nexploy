'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsAddAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { saveAwsAccount } from '@/services/aws.service';
import { verifyAwsCredentials } from '@/lib/aws/s3';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const addAwsAccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(awsAddAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, accessKeyId, secretAccessKey, region } = parsedInput;
            await verifyAwsCredentials({ accessKeyId, secretAccessKey, region });
            await saveAwsAccount(displayName, accessKeyId, secretAccessKey, region);
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
