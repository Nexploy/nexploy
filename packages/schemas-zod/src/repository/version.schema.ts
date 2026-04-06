import { z } from 'zod';

export const syncVersionDeleteSchema = z.object({
    repositoryId: z.string().min(1),
    imageTag: z.string().min(1),
});
