import { z } from 'zod';

export const repositoryCreateFormSchema = z.object({
    name: z.string().min(1, 'Le nom du projet est requis'),

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
    branch: z.string().default('main'),
    gitToken: z
        .string()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
    gitProvider: z.enum(['github', 'gitlab', 'manual']),

    buildType: z.enum(['DOCKERFILE', 'NIXPACKS', 'BUILDPACKS']).default('DOCKERFILE'),
    dockerfilePath: z.string().default('Dockerfile'),
    contextPath: z.string().default('.'),
    buildArgs: z
        .string()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),

    autoDeploy: z.boolean().default(true),
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
