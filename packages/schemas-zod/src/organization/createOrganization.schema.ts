import { z } from 'zod';

export const createOrganizationSchema = z.object({
    name: z.string().min(1).max(100),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
