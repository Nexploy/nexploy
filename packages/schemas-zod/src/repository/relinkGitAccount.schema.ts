import { z } from 'zod';

export const relinkGitAccountSchema = z.object({
    gitAccountId: z.string().min(1),
});

export type RelinkGitAccount = z.infer<typeof relinkGitAccountSchema>;
