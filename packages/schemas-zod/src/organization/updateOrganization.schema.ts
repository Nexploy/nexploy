import { z } from 'zod';

export const updateOrganizationSchema = z.object({
    organizationId: z.string(),
    name: z.string().min(1, 'A organization is Required').max(100),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
