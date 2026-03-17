import { z } from 'zod';

export const repositoryCreateFormSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    repo: z.object(
        {
            id: z.string(),
            name: z.string(),
            fullName: z.string(),
            url: z.string(),
            private: z.boolean(),
            defaultBranch: z.string(),
        },
        {
            error: 'Le dépôt est requis',
        },
    ),
    gitToken: z
        .string()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
    gitProvider: z.enum(['github', 'gitlab', 'manual']),
    gitAccountId: z.string().optional(),
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
