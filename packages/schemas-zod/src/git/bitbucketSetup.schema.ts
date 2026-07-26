import { z } from 'zod';

export const bitbucketSetupSchema = z.object({
    provider: z.literal('bitbucket'),
    displayName: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
});
