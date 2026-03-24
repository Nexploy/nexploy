import { z } from 'zod';

export const startBuildSchema = z.object({
    repositoryId: z.cuid(),
    branch: z.string().optional(),
    commitHash: z.string().optional(),
});

export type StartBuildSchemaType = z.infer<typeof startBuildSchema>;

export const removeBuildSchema = z.object({
    buildId: z.cuid(),
});

export const cancelBuildSchema = z.object({
    buildId: z.cuid(),
});

export const deployVersionSchema = z.object({
    imageTag: z.string(),
    repositoryId: z.cuid(),
    environmentId: z.string().optional(),
});

export const deleteVersionSchema = z.object({
    imageTag: z.string(),
    repositoryId: z.cuid(),
});
