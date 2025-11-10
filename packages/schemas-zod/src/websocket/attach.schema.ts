import { z } from 'zod';

export const attachSchema = z.object({
    containerId: z.string(),
});

export type attachInter = z.infer<typeof attachSchema>;
