import { z } from 'zod';

export const removeMemberSchema = z.object({
    organizationId: z.string(),
    memberIdOrEmail: z.string(),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
