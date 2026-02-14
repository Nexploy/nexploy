'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';
import { createInvitationSchema } from '@workspace/schemas-zod/user/createInvitation.schema';
import { getTranslations } from 'next-intl/server';

export const createInvitation = authActionServer
    .inputSchema(createInvitationSchema)
    .action(async ({ parsedInput: { email, role, expiresInHours }, ctx: { session } }) => {
        const t = await getTranslations('admin');

        if (session.user.role !== 'admin') {
            throw new Error(t('errors.adminOnly'));
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error(t('errors.userAlreadyExists'));
        }

        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvitation) {
            throw new Error(t('errors.invitationAlreadyExists'));
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        const invitation = await prisma.invitation.create({
            data: {
                id: crypto.randomUUID(),
                email,
                role,
                inviterId: session.user.id,
                expiresAt,
                status: 'pending',
            },
        });

        revalidatePath('/admin/users');

        return { invitation };
    });
