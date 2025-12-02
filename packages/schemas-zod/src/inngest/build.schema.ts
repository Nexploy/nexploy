import { z } from 'zod';

export const startBuildSchema = z.object({
    repositoryId: z.cuid(),
});

export const retryBuildSchema = z.object({
    buildId: z.cuid(),
});

export const cancelBuildSchema = z.object({
    buildId: z.cuid(),
});
