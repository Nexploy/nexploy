import { z } from 'zod';

export const banUsersSchema = z.object({
    userId: z.string(),
    action: z.enum(['ban', 'unban']),
    reason: z.string().optional(),
});
