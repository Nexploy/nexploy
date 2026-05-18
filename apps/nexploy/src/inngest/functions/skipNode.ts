import { inngest } from '@/inngest/client';

export const skipNodeFunction = inngest.createFunction(
    { id: 'node-skip', retries: 0 },
    { event: 'node/skip' },
    async ({ event }: { event: { data: { buildId: string; nodeId: string } } }) => {
        const { buildId, nodeId } = event.data;
        return { buildId, nodeId, skipped: true };
    },
);
