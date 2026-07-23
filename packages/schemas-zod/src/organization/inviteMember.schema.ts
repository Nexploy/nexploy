import { z } from 'zod';

export const inviteMemberSchema = z.object({
    organizationId: z.string(),
    email: z.email(),
    role: z.enum(['admin', 'member']),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
