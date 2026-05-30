import { z } from 'zod';

export const createMcpApiKeySchema = z.object({
    name: z.string().min(1).max(32),
});
