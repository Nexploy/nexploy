'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { redirect, RedirectType } from 'next/navigation';
import { deleteRepository } from '@/services/repository.service';
import { deleteRepositorySchema } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { byRepositoryId } from '@/lib/auth/resolveOrgContext';

export const deleteRepositoryAction = authActionServer
    .use(requirePermission('repository', 'delete', byRepositoryId))
    .inputSchema(deleteRepositorySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            await deleteRepository(parsedInput, ctx.session.user.id);
            redirect('/repositories', RedirectType.push);
        } catch (error: unknown) {
            if (isRedirectError(error)) throw error;
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
                throw error;
            }
        }
    });
