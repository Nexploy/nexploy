import { z } from 'zod';
import { branchNameSchema } from './branch.schema';

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
    branch: branchNameSchema,
    gitToken: z
        .string()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
    gitProvider: z.enum(['github', 'gitlab', 'manual']),
    gitAccountId: z.string().optional(),
    environmentId: z.string(),
    autoDeploy: z.boolean().default(true),
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
