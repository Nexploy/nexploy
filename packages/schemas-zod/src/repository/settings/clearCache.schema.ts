import { z } from 'zod';

export const clearCacheSchema = z.object({
    repositoryId: z.string(),
});

export type ClearCacheInput = z.infer<typeof clearCacheSchema>;
