import { prisma } from '../../prisma/prisma';
import { UserRow } from '@/components/admin/users/ColumnsUsers';

export async function getUsers(): Promise<UserRow[]> {
    try {
        return await prisma.user.findMany({
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
            orderBy: {
                createdAt: 'asc',
            },
        });
    } catch {
        throw new Error('Failed to get users');
    }
}

export async function getInvitations() {
    try {
        return await prisma.invitation.findMany({
            where: {
                status: 'pending',
                expiresAt: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    } catch {
        throw new Error('Failed to get invitations');
    }
}
