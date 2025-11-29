'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { getSubscriptionToken } from '@inngest/realtime';
import { inngest } from '@/inngest/client';
import { tokenBuildIdSchema } from '@workspace/schemas-zod/inngest/token.schema';

export const onGetTokenBuildIdAction = authActionServer
    .inputSchema(tokenBuildIdSchema)
    .action(async ({ parsedInput: { buildId, topics } }) => {
        try {
            return await getSubscriptionToken(inngest, {
                channel: `build:${buildId}`,
                topics,
            });
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
