import { z } from 'zod';

export const buildStepSchema = z.enum([
    'clone-repository',
    'prepare-dockerfile',
    'prepare-compose',
    'write-env-file',
    'build-docker-image',
    'deploy-container',
    'deploy-compose',
    'cleanup',
    'finalize-logs',
]);

export const startBuildSchema = z.object({
    repositoryId: z.cuid(),
    commitHash: z.string().optional(),
});

export type StartBuildSchemaType = z.infer<typeof startBuildSchema>;

export const retryBuildSchema = z.object({
    buildId: z.cuid(),
    environmentId: z.cuid(),
});

export type RetryBuildSchemaType = z.infer<typeof retryBuildSchema>;

export const resumeBuildSchema = z.object({
    buildId: z.cuid(),
    startFromStep: buildStepSchema.optional(),
    environmentId: z.cuid(),
});

export type ResumeBuildSchemaType = z.infer<typeof resumeBuildSchema>;

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
