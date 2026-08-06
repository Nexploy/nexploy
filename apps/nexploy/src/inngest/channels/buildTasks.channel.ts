import { realtime } from 'inngest';
import { z } from 'zod';

const buildTasksChannelDef = realtime.channel({
    name: ({ organizationId }: { organizationId: string }) => `build-tasks:${organizationId}`,
    topics: {
        task: { schema: z.any() },
    },
});

export const buildTasksChannelName = (organizationId: string) => `build-tasks:${organizationId}`;

export const createBuildTasksChannel = (organizationId: string) => buildTasksChannelDef({ organizationId });
