import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.string().min(1),
});

export const repositoryIdParamSchema = z.object({
    repositoryId: z.string().min(1),
});

export const buildParamSchema = z.object({
    repositoryId: z.string().min(1),
    buildId: z.string().min(1),
});

export const buildNodeParamSchema = z.object({
    repositoryId: z.string().min(1),
    buildId: z.string().min(1),
    nodeId: z.string().min(1),
});
