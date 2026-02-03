import { z } from 'zod';

export const deleteUserSchema = z.object({
    userId: z.string(),
});
