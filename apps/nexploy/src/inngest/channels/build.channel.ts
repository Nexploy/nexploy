import { realtime } from 'inngest';
import { z } from 'zod';

const buildChannelDef = realtime.channel({
    name: ({ buildId }: { buildId: string }) => `build:${buildId}`,
    topics: {
        log: { schema: z.object({ log: z.any() }) },
        'build-status': { schema: z.object({ buildStatus: z.string() }) },
        'node-status': {
            schema: z.object({
                nodeId: z.string(),
                nodeStatus: z.string(),
                durationMs: z.number().optional(),
                startedAt: z.number().optional(),
            }),
        },
        'node-progress': {
            schema: z.object({
                nodeId: z.string(),
                current: z.number(),
                total: z.number(),
                labelKey: z.string(),
                labelValues: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
                detail: z.string().optional(),
            }),
        },
        'node-summary': {
            schema: z.object({
                nodeId: z.string(),
                key: z.string(),
                values: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
                tone: z.string().optional(),
            }),
        },
        'commit-info': { schema: z.any() },
    },
});

export const createBuildChannel = (buildId: string) => buildChannelDef({ buildId });
