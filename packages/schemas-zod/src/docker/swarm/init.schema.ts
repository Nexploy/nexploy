import { z } from 'zod';

export const initActionSchema = z.object({
    advertiseAddr: z.string(),
    listenAddr: z.string(),
    forceNewCluster: z.boolean().default(false),
});
