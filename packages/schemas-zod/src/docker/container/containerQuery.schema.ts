import { z } from 'zod';

export const containersQuerySchema = z.object({
    name: z.string().optional(),
});

export type ContainersQueryInput = z.infer<typeof containersQuerySchema>;
