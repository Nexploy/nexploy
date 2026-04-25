import { z } from 'zod';

export const setupWebhookSchema = z.object({
    repositoryId: z.cuid(),
});

export type SetupWebhook = z.infer<typeof setupWebhookSchema>;
