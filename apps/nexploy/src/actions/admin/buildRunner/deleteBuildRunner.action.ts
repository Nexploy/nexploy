'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteBuildRunnerSchema } from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import { deleteBuildRunner } from '@/services/buildRunner.service';
import { setToastServer } from '@/lib/toastServer';

export const deleteBuildRunnerAction = authActionServer
    .metadata({ name: 'buildRunner.delete' })
    .use(requirePermission('buildRunner', 'delete'))
    .inputSchema(deleteBuildRunnerSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteBuildRunner(parsedInput.id);
            revalidatePath('/admin/servers');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
