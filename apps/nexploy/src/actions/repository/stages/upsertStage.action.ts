'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { createStage, updateStage } from '@/services/repository/deploymentStage.service';
import { deploymentStageSchema } from '@workspace/schemas-zod/repository/deploymentStage.schema';
import { revalidatePath } from 'next/cache';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const upsertStageAction = authActionServer
    .use(requirePermission('stage', 'manage', byRepositoryId))
    .inputSchema(deploymentStageSchema)
    .action(async ({ parsedInput }) => {
        try {
            const stage = parsedInput.id
                ? await updateStage({ ...parsedInput, id: parsedInput.id })
                : await createStage(parsedInput);
            revalidatePath('/repositories/[repositoryId]/stages', 'page');
            return stage;
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
