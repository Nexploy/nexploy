import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
    organizationId: z.string(),
    memberId: z.string(),
    role: z.enum(['owner', 'admin', 'member']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
