'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getSubscriptionToken } from 'inngest/realtime';
import { inngest } from '@/inngest/client';
import { tokenBuildIdSchema } from '@workspace/schemas-zod/inngest/token.schema';
import { byBuildId } from '@/lib/auth/resolveOrgContext';

export const onGetTokenBuildIdAction = authActionServer
    .use(requirePermission('build', 'read', byBuildId))
    .inputSchema(tokenBuildIdSchema)
    .action(async ({ parsedInput: { buildId, topics } }) => {
        try {
            const token = await getSubscriptionToken(inngest, {
                channel: `build:${buildId}`,
                topics,
            });
            return { ...token, apiBaseUrl: process.env.NEXPLOY_URL ?? token.apiBaseUrl };
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
