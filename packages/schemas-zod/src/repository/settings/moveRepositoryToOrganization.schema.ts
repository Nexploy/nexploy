import { z } from 'zod';

export const moveRepositoryToOrganizationSchema = z.object({
    organizationId: z.string().min(1),
});

export type MoveRepositoryToOrganization = z.infer<typeof moveRepositoryToOrganizationSchema>;
