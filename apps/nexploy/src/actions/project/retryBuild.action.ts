'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { retryBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import {
    findBuildWithEnvInngest,
    retryBuildProjectInngest,
} from '@/services/inngest/build.inngest.service';
import { deleteBuildLogInngest } from '@/services/inngest/log.inngest.service';

export const onRetryBuild = authActionServer
    .inputSchema(retryBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const { buildId } = parsedInput;

            const existingBuild = await findBuildWithEnvInngest(buildId);

            if (!existingBuild || existingBuild.status === 'COMPLETED') {
                throw new Error('Build or project not found');
            }

            await deleteBuildLogInngest(buildId);
            await retryBuildProjectInngest(buildId, ctx.session.user.id, existingBuild);
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message || 'Failed to retry build',
                });
            }
            throw err;
        }
    });
