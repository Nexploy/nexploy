'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deleteStage } from '@/services/repository/deploymentStage.service';
import { deleteDeploymentStageSchema } from '@workspace/schemas-zod/repository/deploymentStage.schema';
import { revalidatePath } from 'next/cache';
import { byStageEntityId } from '@/lib/auth/resolveOrgContext';

export const deleteStageAction = authActionServer
    .use(requirePermission('stage', 'manage', byStageEntityId))
    .inputSchema(deleteDeploymentStageSchema)
    .action(async ({ parsedInput }) => {
        try {
            await deleteStage(parsedInput.id);
            revalidatePath('/repositories/[repositoryId]/stages', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({ type: 'error', message: error.message });
            }
            throw error;
        }
    });
