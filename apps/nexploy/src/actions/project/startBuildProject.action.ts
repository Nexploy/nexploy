'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildProject } from '@/services/inngest/build.service';
import { revalidatePath } from 'next/cache';
import { getProjectWithEnv } from '@/services/project.service';

export const onStartBuildProject = authActionServer
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput }) => {
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

            await startBuildProject(project);

            await setToastServer({
                type: 'success',
                message: 'Build started successfully',
            });
            revalidatePath('/[locale]/projects/[projectId]', 'page');
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message || 'Failed to start build',
                });
            }
        }
    });
