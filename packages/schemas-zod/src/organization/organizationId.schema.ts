import { z } from 'zod';

export const organizationIdSchema = z.object({
    organizationId: z.string(),
});

export type OrganizationIdInput = z.infer<typeof organizationIdSchema>;
