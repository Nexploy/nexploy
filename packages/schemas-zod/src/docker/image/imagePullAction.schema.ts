import { z } from 'zod';

export const imagePullSchema = z.object({
    imageName: z.string().min(1, 'Image name is required'),
    registryId: z.string().optional(),
});
