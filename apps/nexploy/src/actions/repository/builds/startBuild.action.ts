'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HTTPError } from 'ky';
import { startBuildSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { startBuildRepositoryInngest } from '@/services/inngest/build.inngest.service';
import { revalidatePath } from 'next/cache';

export const onStartBuild = authActionServer
    .inputSchema(startBuildSchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            await startBuildRepositoryInngest(parsedInput, ctx.session.user.id);

            revalidatePath('/[locale]/repositories', 'page');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message || 'Failed to start build',
                });
            }
        }
    });
