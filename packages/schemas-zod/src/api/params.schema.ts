import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.string().min(1),
});

export const buildsQuerySchema = z.object({
    cursor: z.string().optional(),
    take: z.coerce.number().int().positive().max(100).default(20),
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
