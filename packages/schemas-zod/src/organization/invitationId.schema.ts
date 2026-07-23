import { z } from 'zod';

export const invitationIdSchema = z.object({
    invitationId: z.string(),
});

export type InvitationIdInput = z.infer<typeof invitationIdSchema>;
