import { z } from 'zod';

export const mirrorImageSchema = z.object({
    sourceImage: z.string().min(1),
    sourceUsername: z.string().optional(),
    sourcePassword: z.string().optional(),
    targetRegistryId: z.string().min(1),
});

export type MirrorImageInput = z.infer<typeof mirrorImageSchema>;
