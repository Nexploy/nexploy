import { prisma } from '../../../prisma/prisma';
import { encrypt } from '@/lib/encryption';
import { getUserSession } from '@/services/auth/auth.service';
import { EnvironmentInput } from '@workspace/schemas-zod/environment/environment.schema';

export async function getUserEnvironments() {
    try {
        const session = await getUserSession();

        return prisma.environment.findMany({
            where: {
                OR: [{ userId: session?.user.id }, { userId: null }],
                isActive: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    } catch {
        throw new Error('Failed to get user environments');
    }
}

export async function getActiveEnvironments() {
    try {
        return prisma.environment.findMany({
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
    } catch {
        throw new Error('Failed to get active environments');
    }
}

export async function getDefaultEnvironment() {
    try {
        return prisma.environment.findFirst({
            where: { isDefault: true, isActive: true },
        });
    } catch {
        throw new Error('Failed to get default environment');
    }
}

export async function getEnvironmentById(id: string) {
    try {
        return prisma.environment.findUnique({
            where: { id },
        });
    } catch {
        throw new Error('Failed to get environment');
    }
}

export async function createEnvironment(data: EnvironmentInput, userId: string) {
    try {
        return await prisma.environment.create({
            data: {
                ...data,
                userId,
                tlsCert: data.tlsCert ? encrypt(data.tlsCert) : null,
                tlsKey: data.tlsKey ? encrypt(data.tlsKey) : null,
                tlsCa: data.tlsCa ? encrypt(data.tlsCa) : null,
            },
        });
    } catch {
        throw new Error('Failed to create environment');
    }
}

export async function updateEnvironment(
    id: string,
    data: {
        name?: string;
        connectionType?: 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
        socketPath?: string;
        host?: string;
        port?: number;
        tlsCert?: string;
        tlsKey?: string;
        tlsCa?: string;
        description?: string;
        isActive?: boolean;
    },
) {
    try {
        const encryptedData = {
            ...data,
            tlsCert: data.tlsCert ? encrypt(data.tlsCert) : undefined,
            tlsKey: data.tlsKey ? encrypt(data.tlsKey) : undefined,
            tlsCa: data.tlsCa ? encrypt(data.tlsCa) : undefined,
        };

        const environment = await prisma.environment.update({
            where: { id },
            data: encryptedData,
        });

        return environment;
    } catch {
        throw new Error('Failed to update environment');
    }
}

export async function setDefaultEnvironment(id: string) {
    try {
        await prisma.$transaction([
            prisma.environment.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            }),
            prisma.environment.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);
    } catch {
        throw new Error('Failed to set default environment');
    }
}

export async function deleteEnvironment(id: string) {
    try {
        const environment = await prisma.environment.findUnique({
            where: { id },
        });

        if (environment?.isDefault) {
            throw new Error();
        }

        await prisma.environment.delete({
            where: { id },
        });
    } catch {
        throw new Error('Failed to delete environment');
    }
}
