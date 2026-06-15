import { z } from 'zod';

export const providerSchema = z.enum([
    'OPENAI',
    'ANTHROPIC',
    'GOOGLE',
    'OPENROUTER',
    'MISTRAL',
    'GROQ',
    'PERPLEXITY',
    'GROK',
]);

export const addProviderApiKeySchema = z.object({
    provider: providerSchema,
    apiKey: z.string().min(1),
});

export const deleteAiConfigSchema = z.object({
    provider: providerSchema,
});
