'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { HttpErrorResponse } from 'drino';
import { getSubscriptionToken } from '@inngest/realtime';
import { z } from 'zod';
import { inngest } from '@/inngest/client';

const schema = z.object({
    deploymentId: z.string(),
    topics: z.array(z.string()),
});

export const onGetTokenDeploymenIdAction = authActionServer
    .inputSchema(schema)
    .action(async ({ parsedInput: { deploymentId, topics } }) => {
        try {
            return await getSubscriptionToken(inngest, {
                channel: `build:${deploymentId}`,
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
