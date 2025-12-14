'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { revalidatePath } from 'next/cache';

export const onStartBuild = authActionServer
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput: { repositoryId, commitHash }, ctx }) => {
        try {
            await startBuildRepositoryInngest(repositoryId, ctx.session.user.id, commitHash);

            revalidatePath('/[locale]/repositories', 'page');
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message || 'Failed to start build',
                });
            }
        }
    });
