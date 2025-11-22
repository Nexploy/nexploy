import { z } from 'zod';

export const projectCreateFormSchema = z.object({
    name: z.string().min(1, 'Le nom du projet est requis'),
    description: z.string().optional(),

    repositoryUrl: z.url("L'URL du dépôt doit être valide"),
    branch: z.string().default('main'),
    gitToken: z.string().optional(),

    buildType: z.enum(['DOCKERFILE', 'NIXPACKS', 'BUILDPACKS']).default('DOCKERFILE'),
    dockerfilePath: z.string().default('Dockerfile'),
    contextPath: z.string().default('.'),
    buildArgs: z.string().optional(),

    autoDeploy: z.boolean().default(true),
});

export type ProjectCreateForm = z.infer<typeof projectCreateFormSchema>;
