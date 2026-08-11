'use server';

import { revalidatePath } from 'next/cache';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { regenerateBuildRunnerTokenSchema } from '@workspace/schemas-zod/buildRunner/buildRunner.schema';
import { regenerateBuildRunnerToken } from '@/services/buildRunner.service';
import { setToastServer } from '@/lib/toastServer';

export const regenerateBuildRunnerTokenAction = authActionServer
    .metadata({ name: 'buildRunner.regenerateToken' })
    .use(requirePermission('buildRunner', 'update'))
    .inputSchema(regenerateBuildRunnerTokenSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { runner, token } = await regenerateBuildRunnerToken(parsedInput.id);

            revalidatePath('/admin/servers');

            return { id: runner.id, name: runner.name, token };
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
