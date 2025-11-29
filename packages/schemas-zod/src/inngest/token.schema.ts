import { z } from 'zod';

export const tokenBuildIdSchema = z.object({
    buildId: z.string(),
    topics: z.array(z.string()),
});
