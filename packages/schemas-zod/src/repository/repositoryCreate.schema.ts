import { z } from 'zod';

export const repositoryCreateFormSchema = z.object({
    name: z.string(),
    repo: z.object(
        {
            id: z
                .string({ error: 'Repository is required' })
                .min(1, 'Repository is required'),
            name: z.string().min(1),
            fullName: z.string().min(1),
            url: z.string().min(1),
            private: z.boolean(),
            defaultBranch: z
                .string({ error: 'Branch is required' })
                .min(1, 'Branch is required'),
        },
        { error: 'Repository is required' },
    ),
    gitProvider: z.enum(['github', 'gitlab', 'manual']),
    gitAccountId: z
        .string({ error: 'Git account is required' })
        .min(1, 'Git account is required'),
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
