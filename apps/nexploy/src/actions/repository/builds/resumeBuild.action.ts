'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { resumeBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import {
    findBuildWithEnvInngest,
    resumeBuildRepositoryInngest,
} from '@/services/inngest/build.inngest.service';

export const onResumeBuild = authActionServer
    .inputSchema(resumeBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { buildId, startFromStep } = parsedInput;

            const existingBuild = await findBuildWithEnvInngest(buildId);

            if (!existingBuild || existingBuild.status === 'COMPLETED') {
                throw new Error('Build not found or already completed');
            }

            if (existingBuild.status !== 'FAILED') {
                throw new Error('Can only resume failed builds');
            }

            await resumeBuildRepositoryInngest(
                buildId,
                ctx.session.user.id,
                existingBuild,
                startFromStep,
            );

            await setToastServer({
                type: 'success',
                message: `Build resumed from step: ${startFromStep || 'beginning'}`,
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message || 'Failed to resume build',
                });
            }
            throw err;
        }
    });
