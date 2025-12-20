'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { removeBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { removeBuild } from '@/services/inngest/build.inngest.service';

export const onRemoveBuild = authActionServer
    .inputSchema(removeBuildSchema)
    .action(async ({ parsedInput: { buildId } }) => {
        try {
            return await removeBuild(buildId);
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
