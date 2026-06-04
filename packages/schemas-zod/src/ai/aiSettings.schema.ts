import { z } from 'zod';

export const updateAISettingsSchema = z.object({
    requireDestructiveConfirmation: z.boolean(),
});
