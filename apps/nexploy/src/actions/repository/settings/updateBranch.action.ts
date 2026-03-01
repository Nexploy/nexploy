'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { branchSchema } from '@workspace/schemas-zod/repository/branch.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { revalidatePath } from 'next/cache';
import { setToastServer } from '@/lib/toastServer';
import { updateBranchRepository } from '@/services/repository.service';

export const updateBranchAction = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(branchSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput: { branch }, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            await updateBranchRepository(branch, repositoryId);

            revalidatePath(`/repositories/${repositoryId}`);
            return branch;
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
