import { z } from 'zod';

export const updateEnvironmentSchema = z.object({
    environmentId: z.string().min(1, 'Environment ID is required'),
});

export type UpdateEnvironmentForm = z.infer<typeof updateEnvironmentSchema>;
