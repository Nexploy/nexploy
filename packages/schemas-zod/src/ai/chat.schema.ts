import { z } from 'zod';

export const chatBodySchema = z.object({
    messages: z.array(z.any()),
    model: z.string(),
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
