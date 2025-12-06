'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { z } from 'zod';
import { prisma } from '../../../prisma/prisma';
import { revalidatePath } from 'next/cache';

const createInvitationSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'user']).default('user'),
    expiresInHours: z.number().min(1).max(168).default(24),
});

const updateUserRoleSchema = z.object({
    userId: z.string(),
    role: z.enum(['admin', 'user']),
});

const deleteUserSchema = z.object({
    userId: z.string(),
});

const banUserSchema = z.object({
    userId: z.string(),
    ban: z.boolean(),
    reason: z.string().optional(),
});

export const createInvitation = authActionServer
    .schema(createInvitationSchema)
    .action(async ({ parsedInput: { email, role, expiresInHours }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can create invitations');
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('A user with this email already exists');
        }

        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvitation) {
            throw new Error('An active invitation for this email already exists');
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

export const updateUserRole = authActionServer
    .schema(updateUserRoleSchema)
    .action(async ({ parsedInput: { userId, role }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can update user roles');
        }

        if (userId === session.user.id) {
            throw new Error('You cannot change your own role');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath('/admin/users');

        return { user };
    });

export const deleteUser = authActionServer
    .schema(deleteUserSchema)
    .action(async ({ parsedInput: { userId }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can delete users');
        }

        if (userId === session.user.id) {
            throw new Error('You cannot delete your own account');
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/users');

        return { success: true };
    });

export const banUser = authActionServer
    .schema(banUserSchema)
    .action(async ({ parsedInput: { userId, ban, reason }, ctx: { session } }) => {
        if (session.user.role !== 'admin') {
            throw new Error('Only admins can ban/unban users');
        }

        if (userId === session.user.id) {
            throw new Error('You cannot ban yourself');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                banned: ban,
                banReason: ban ? reason : null,
            },
        });

        revalidatePath('/admin/users');

        return { user };
    });

export const revokeInvitation = authActionServer
    .schema(z.object({ invitationId: z.string() }))
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

export async function getUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            banned: true,
            banReason: true,
            createdAt: true,
            image: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getInvitations() {
    return prisma.invitation.findMany({
        where: {
            status: 'pending',
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });
}
