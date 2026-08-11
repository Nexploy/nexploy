'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { updateBuildRunnerSchema } from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import { updateBuildRunner } from '@/services/buildRunner.service';
import { setToastServer } from '@/lib/toastServer';

export const updateBuildRunnerAction = authActionServer
    .metadata({ name: 'buildRunner.update' })
    .use(requirePermission('buildRunner', 'update'))
    .inputSchema(updateBuildRunnerSchema)
    .action(async ({ parsedInput }) => {
        try {
            await updateBuildRunner(parsedInput);
            revalidatePath('/admin/servers');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
