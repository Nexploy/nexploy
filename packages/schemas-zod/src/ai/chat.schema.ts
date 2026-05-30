import { z } from 'zod';

export const chatBodySchema = z.object({
    messages: z.array(z.any()),
    modelId: z.string().optional(),
    provider: z.enum(['openai', 'anthropic', 'google', 'openrouter']).optional(),
});
