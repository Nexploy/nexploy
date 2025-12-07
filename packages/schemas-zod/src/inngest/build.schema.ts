import { z } from 'zod';

export const buildStepSchema = z.enum([
    'clone-repository',
    'prepare-dockerfile',
    'write-env-file',
    'build-docker-image',
    'deploy-container',
    'cleanup',
    'finalize-logs',
]);

export const startBuildSchema = z.object({
    repositoryId: z.cuid(),
});

export const retryBuildSchema = z.object({
    buildId: z.cuid(),
});

export const removeBuildSchema = z.object({
    buildId: z.cuid(),
});

export const resumeBuildSchema = z.object({
    buildId: z.cuid(),
    startFromStep: buildStepSchema.optional(),
});

export const cancelBuildSchema = z.object({
    buildId: z.cuid(),
});

export const deployVersionSchema = z.object({
    buildId: z.cuid(),
    repositoryId: z.cuid(),
});
