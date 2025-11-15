import { z } from 'zod';

export const containerActionsSchema = z.object({
    containerId: z.string(),
});
