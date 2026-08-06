'use server';

import { getSubscriptionToken } from 'inngest/realtime';
import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { inngest } from '@/inngest/client';
import { buildTasksChannelName } from '@/inngest/channels/buildTasks.channel';
import { HOST_SCOPED, resolveActiveOrganizationId } from '@/lib/auth/resolveOrgContext';

export const onGetTokenBuildTasksAction = authActionServer
    .metadata({ name: 'inngest.getBuildTasksToken' })
    .use(requirePermission('build', 'read', HOST_SCOPED))
    .action(async ({ ctx }) => {
        const organizationId = await resolveActiveOrganizationId(ctx.session);

        if (!organizationId) return null;

        const token = await getSubscriptionToken(inngest, {
            channel: buildTasksChannelName(organizationId),
            topics: ['task'],
        });

        return { ...token, apiBaseUrl: process.env.NEXPLOY_URL ?? token.apiBaseUrl };
    });
