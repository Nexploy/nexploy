import { z } from 'zod';

export const teardownWebhookSchema = z.object({
    repositoryId: z.cuid(),
});

export type TeardownWebhook = z.infer<typeof teardownWebhookSchema>;
