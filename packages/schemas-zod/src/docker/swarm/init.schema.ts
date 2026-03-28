import { z } from 'zod';

export const initActionSchema = z.object({
    advertiseAddr: z.string().min(1),
    listenAddr: z.string().optional(),
    forceNewCluster: z.boolean().optional().default(false),
});
