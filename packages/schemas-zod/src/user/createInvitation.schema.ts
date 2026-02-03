import { z } from 'zod';

export const createInvitationSchema = z.object({
    email: z.email(),
    role: z.enum(['admin', 'user']).default('user'),
    expiresInHours: z.number().min(1).max(168).default(24),
});
