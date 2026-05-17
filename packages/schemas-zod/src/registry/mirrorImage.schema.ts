import { z } from 'zod';

export const mirrorImageSchema = z.object({
    sourceImage: z.string().min(1, 'Source image is required'),
    targetRegistryId: z.string().min(1, 'Target registry is required'),
    sourceUsername: z.string().optional(),
    sourcePassword: z.string().optional(),
});

export type MirrorImageInput = z.infer<typeof mirrorImageSchema>;
