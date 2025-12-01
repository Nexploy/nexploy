'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildProjectInngest } from '@/services/inngest/build.inngest.service';
import { getProjectWithEnv } from '@/services/project.service';
import { revalidatePath } from 'next/cache';

export const onStartBuildProject = authActionServer
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { projectId } = parsedInput;
            const project = await getProjectWithEnv(projectId);

            if (!project) {
                await setToastServer({
                    type: 'error',
                    message: 'Project not found',
                });
                throw new Error('Project not found');
            }

            await startBuildProjectInngest(project, ctx.session.user.id);

            revalidatePath('/[locale]/projects', 'page');
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message || 'Failed to start build',
                });
            }
        }
    });
