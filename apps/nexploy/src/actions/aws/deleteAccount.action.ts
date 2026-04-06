'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsDeleteAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { deleteAwsAccount } from '@/services/aws.service';
import { revalidatePath } from 'next/cache';

export const deleteAwsAccountAction = authActionServer
    .use(requirePermission('gitProvider', 'delete'))
    .inputSchema(awsDeleteAccountSchema)
    .action(async ({ parsedInput }) => {
        await deleteAwsAccount(parsedInput.id);
        revalidatePath('/admin/integrations');
    });
