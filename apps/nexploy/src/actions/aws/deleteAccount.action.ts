'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { awsDeleteAccountSchema } from '@workspace/schemas-zod/aws/aws.schema';
import { deleteAwsAccount } from '@/services/aws.service';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';

export const deleteAwsAccountAction = authActionServer
    .use(requirePermission('cloudBackup', 'manage'))
    .inputSchema(awsDeleteAccountSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteAwsAccount(parsedInput.id);
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
