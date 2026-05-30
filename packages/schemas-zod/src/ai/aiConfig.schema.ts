import { z } from 'zod';

export const providerSchema = z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'OPENROUTER']);

export const upsertProviderApiKeySchema = z.object({
    provider: providerSchema,
    apiKey: z.string().min(1).nullable(),
});
