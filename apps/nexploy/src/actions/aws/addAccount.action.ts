'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsAddAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { saveAwsAccount } from '@/services/aws.service';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const addAwsAccountAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(awsAddAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, accessKeyId, secretAccessKey, region } = parsedInput;
            await saveAwsAccount(displayName, accessKeyId, secretAccessKey, region);
            revalidatePath('/admin/integrations');
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
