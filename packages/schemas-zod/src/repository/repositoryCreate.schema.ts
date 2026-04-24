import { z } from 'zod';

export const repositoryCreateFormSchema = z.object({
    name: z.string(),
    repo: z.object({
        id: z.string(),
        name: z.string(),
        fullName: z.string(),
        url: z.string(),
        private: z.boolean(),
        defaultBranch: z.string(),
    }),
    gitProvider: z.enum(['github', 'gitlab', 'manual']),
    gitAccountId: z.string(),
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
