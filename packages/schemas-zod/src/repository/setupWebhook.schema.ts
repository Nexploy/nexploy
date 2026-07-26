import { z } from 'zod';

export const setupWebhookSchema = z.object({
    repositoryId: z.cuid(),
    refresh: z.boolean().optional(),
});

export type SetupWebhook = z.infer<typeof setupWebhookSchema>;
