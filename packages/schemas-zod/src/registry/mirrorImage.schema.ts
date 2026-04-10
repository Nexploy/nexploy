import { z } from 'zod';

export const mirrorImageSchema = z.object({
    sourceImage: z.string().min(1),
    targetRegistryId: z.string().min(1),
    sourceUsername: z.string().optional(),
    sourcePassword: z.string().optional(),
});

export type MirrorImageInput = z.infer<typeof mirrorImageSchema>;
