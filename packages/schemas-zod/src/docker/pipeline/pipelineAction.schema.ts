import { z } from 'zod';

export const deploySchema = z.object({
    repositoryId: z.string().min(1),
    imageName: z.string().min(1),
    options: z
        .object({
            containerName: z.string().optional(),
            envVars: z.record(z.string(), z.string()).optional(),
            labels: z.record(z.string(), z.string()).optional(),
        })
        .optional(),
});

export const deployComposeSchema = z.object({
    repositoryId: z.string().optional(),
    projectName: z.string().min(1),
    envVars: z.record(z.string(), z.string()).optional(),
    composeConfig: z.string().min(1),
    labels: z.record(z.string(), z.string()).optional(),
});
