import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type {
    CreateRegistryInput,
    UpdateRegistryInput,
} from '@workspace/schemas-zod/registry/registry.schema';

export interface RegistryInfo {
    id: string;
    name: string;
    url: string;
    username: string | null;
    isDefault: boolean;
    createdAt: Date;
}

export async function getRegistries(): Promise<RegistryInfo[]> {
    try {
        return prisma.dockerRegistry.findMany({
            select: {
                id: true,
                name: true,
                url: true,
                username: true,
                isDefault: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get registries');
    }
}

export async function createRegistry(data: CreateRegistryInput): Promise<RegistryInfo> {
    try {
        const isFirst = (await prisma.dockerRegistry.count()) === 0;

        return prisma.dockerRegistry.create({
            data: {
                name: data.name,
                url: data.url,
                username: data.username || null,
                password: data.password ? encrypt(data.password) : null,
                isDefault: isFirst,
            },
            select: {
                id: true,
                name: true,
                url: true,
                username: true,
                isDefault: true,
                createdAt: true,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to create registry');
    }
}

export async function updateRegistry(data: UpdateRegistryInput): Promise<RegistryInfo> {
    const updateData: Record<string, unknown> = {
        name: data.name,
        url: data.url,
        username: data.username || null,
    };

    if (data.password) {
        updateData.password = encrypt(data.password);
    }

    try {
        return prisma.dockerRegistry.update({
            where: { id: data.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                url: true,
                username: true,
                isDefault: true,
                createdAt: true,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update registry');
    }
}

export async function deleteRegistry(id: string): Promise<void> {
    try {
        const registry = await prisma.dockerRegistry.findUnique({
            where: { id },
            select: { isDefault: true },
        });

        await prisma.dockerRegistry.delete({ where: { id } });

        if (registry?.isDefault) {
            const next = await prisma.dockerRegistry.findFirst({ orderBy: { createdAt: 'asc' } });
            if (next) {
                await prisma.dockerRegistry.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }
    } catch (error: unknown) {
        throw new Error('Failed to delete registry');
    }
}

export async function setDefaultRegistry(id: string): Promise<void> {
    try {
        await prisma.$transaction([
            prisma.dockerRegistry.updateMany({ data: { isDefault: false } }),
            prisma.dockerRegistry.update({ where: { id }, data: { isDefault: true } }),
        ]);
    } catch (error: unknown) {
        throw new Error('Failed to set default registry');
    }
}

export async function getDefaultRegistry() {
    const registry = await prisma.dockerRegistry.findFirst({
        where: { isDefault: true },
        select: { id: true, name: true, url: true, username: true, password: true },
    });

    if (!registry) return null;

    return {
        ...registry,
        password: registry.password ? decrypt(registry.password) : null,
    };
}
