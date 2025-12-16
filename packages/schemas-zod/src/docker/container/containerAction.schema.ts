import { z } from 'zod';

export const containerActionsSchema = z.object({
    containerId: z.string(),
    // environmentId is now automatically injected via middleware, no longer needed in schema
});
