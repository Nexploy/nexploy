import { z } from 'zod';

export const projectCreateFormSchema = z.object({
    name: z.string().min(1, 'Le nom du projet est requis'),
    description: z.string().optional(),

    repo: z.object({
        id: z.string(),
        name: z.string(),
        fullName: z.string(),
        url: z.string(),
        private: z.boolean(),
        defaultBranch: z.string(),
    }),
    branch: z.string().default('main'),
    gitToken: z.string().optional(),
    gitProvider: z.enum(['github', 'gitlab', 'manual']).optional(),

    buildType: z.enum(['DOCKERFILE', 'NIXPACKS', 'BUILDPACKS']).default('DOCKERFILE'),
    dockerfilePath: z.string().default('Dockerfile'),
    contextPath: z.string().default('.'),
    buildArgs: z.string().optional(),

    autoDeploy: z.boolean().default(true),
});

export type ProjectCreateForm = z.infer<typeof projectCreateFormSchema>;
