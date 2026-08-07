import { z } from 'zod';

export const giteaSetupSchema = z.object({
    provider: z.literal('gitea'),
    displayName: z.string().min(1).max(100, 'Display name must be at most 100 characters'),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    baseUrl: z.url(),
});
