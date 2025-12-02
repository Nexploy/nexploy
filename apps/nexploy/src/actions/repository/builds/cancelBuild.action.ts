'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { cancelBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { cancelBuildInngest } from '@/services/inngest/build.inngest.service';

export const onCancelBuild = authActionServer
    .inputSchema(cancelBuildSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { buildId } = parsedInput;
            await cancelBuildInngest(buildId);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to cancel build';
            await setToastServer({
                type: 'error',
                message,
            });
            throw err;
        }
    });
