import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.string().min(1),
});

export const buildsQuerySchema = z.object({
    cursor: z.string().optional(),
    take: z.coerce.number().int().positive().max(100).default(20),
    stage: z.string().optional(),
});

export const repositoryIdParamSchema = z.object({
    repositoryId: z.string().min(1),
});

export const stageParamSchema = z.object({
    repositoryId: z.string().min(1),
    stageId: z.string().min(1),
});

export const stageQuerySchema = z.object({
    stage: z.string().optional(),
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

export const organizationIdParamSchema = z.object({
    organizationId: z.string().min(1),
});

export const providerParamSchema = z.object({
    provider: z.enum([
        'OPENAI',
        'ANTHROPIC',
        'GOOGLE',
        'OPENROUTER',
        'MISTRAL',
        'GROQ',
        'PERPLEXITY',
        'GROK',
    ]),
});
