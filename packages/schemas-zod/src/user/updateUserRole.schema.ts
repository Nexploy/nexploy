import { z } from 'zod';

export const updateUserRoleSchema = z.object({
    userId: z.string(),
    role: z.enum(['admin', 'readWrite', 'read']),
});
