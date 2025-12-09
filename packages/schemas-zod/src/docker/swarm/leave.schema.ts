import { z } from 'zod';

export const swarmLeaveSchema = z.object({
    force: z.boolean().optional().default(false),
});

export type SwarmLeaveInput = z.infer<typeof swarmLeaveSchema>;
