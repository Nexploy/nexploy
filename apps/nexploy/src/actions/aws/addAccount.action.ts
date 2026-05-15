'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsAddAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { saveAwsAccount } from '@/services/aws.service';
import { verifyAwsCredentials } from '@/lib/aws/s3';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';

async function getAwsAddAccountSchema() {
    const t = await getTranslations('validation');
    return awsAddAccountSchema(t);
}

export const addAwsAccountAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(getAwsAddAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, accessKeyId, secretAccessKey, region } = parsedInput;
            await verifyAwsCredentials({ accessKeyId, secretAccessKey, region });
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
