'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { getRepositorieWithEnv } from '@/services/repositorie.service';
import { revalidatePath } from 'next/cache';

export const onStartBuild = authActionServer
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput: { repositoryId }, ctx }) => {
        try {
            const repository = await getRepositorieWithEnv(repositoryId);

            if (!repository) {
                await setToastServer({
                    type: 'error',
                    message: 'Repository not found',
                });
                throw new Error('Repository not found');
            }

            await startBuildRepositoryInngest(repository, ctx.session.user.id);

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
