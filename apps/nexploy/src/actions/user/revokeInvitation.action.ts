'use server';

import { prisma } from '../../../prisma/prisma';
import { authActionServer } from '@/lib/api/safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export const revokeInvitation = authActionServer
    .inputSchema(z.object({ invitationId: z.string() }))
    .action(async ({ parsedInput: { invitationId }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can revoke invitations');
        }

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'revoked' },
        });

        revalidatePath('/admin/users');

        return { success: true };
    });
