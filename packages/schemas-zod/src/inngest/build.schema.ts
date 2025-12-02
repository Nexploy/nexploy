import { z } from 'zod';

export const buildSchema = z.object({
    config: z.object({
        projectId: z.string(),
        projectPath: z.string().default('.'),
        gitUrl: z.url(),
        gitBranch: z.string().default('main'),
        gitToken: z.string().optional(),
        envVariables: z.record(z.string(), z.string()).default({}),
        dockerfile: z.string().optional(),
        dockerfilePath: z.string().optional(),
        imageName: z.string(),
        imageTag: z.string().default('latest'),
        port: z.number().optional(),
        autoDeploy: z.boolean().default(true),
    }),
    buildId: z.cuid(),
});

export const startBuildSchema = z.object({
    projectId: z.cuid(),
});

export const retryBuildSchema = z.object({
    buildId: z.cuid(),
});

export const cancelBuildSchema = z.object({
    buildId: z.cuid(),
});
