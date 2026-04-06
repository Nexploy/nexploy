'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsAddAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { saveAwsAccount } from '@/services/aws.service';
import { revalidatePath } from 'next/cache';

export const addAwsAccountAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(awsAddAccountSchema)
    .action(async ({ parsedInput }) => {
        const { displayName, accessKeyId, secretAccessKey, region } = parsedInput;
        await saveAwsAccount(displayName, accessKeyId, secretAccessKey, region);
        revalidatePath('/admin/integrations');
    });
