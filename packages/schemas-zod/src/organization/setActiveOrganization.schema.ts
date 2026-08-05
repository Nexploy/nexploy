import { z } from 'zod';

export const setActiveOrganizationSchema = z.object({
    organizationId: z.string().nullable(),
});

export type SetActiveOrganizationInput = z.infer<typeof setActiveOrganizationSchema>;
