import { z } from 'zod';

export const disconnectGitAccountSchema = z.object({
    gitProviderId: z.string(),
});
