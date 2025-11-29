import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { buildFunction } from '@/inngest/functions/build';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [buildFunction],
});
