'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getSubscriptionToken } from '@inngest/realtime';
import { inngest } from '@/inngest/client';
import { tokenBuildIdSchema } from '@workspace/schemas-zod/inngest/token.schema';

export const onGetTokenBuildIdAction = authActionServer
    .use(requirePermission('build', 'read'))
    .inputSchema(tokenBuildIdSchema)
    .action(async ({ parsedInput: { buildId, topics } }) => {
        try {
            const token = await getSubscriptionToken(inngest, {
                channel: `build:${buildId}`,
                topics,
            });
            // Inject the public nexploy URL so the browser WebSocket connects through
            // nexploy's /v1/realtime/ proxy instead of trying to reach Inngest cloud.
            return { ...token, app: { apiBaseUrl: process.env.BETTER_AUTH_URL } } as typeof token;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
