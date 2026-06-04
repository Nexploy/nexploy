import { realtime } from 'inngest';
import { z } from 'zod';

const buildChannelDef = realtime.channel({
    name: ({ buildId }: { buildId: string }) => `build:${buildId}`,
    topics: {
        log: { schema: z.object({ log: z.any() }) },
        'build-status': { schema: z.object({ buildStatus: z.string() }) },
        'node-status': { schema: z.object({ nodeId: z.string(), nodeStatus: z.string() }) },
        'commit-info': { schema: z.any() },
    },
});

export const createBuildChannel = (buildId: string) => buildChannelDef({ buildId });
