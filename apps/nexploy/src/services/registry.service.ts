import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type { CreateRegistryInput, UpdateRegistryInput, } from '@workspace/schemas-zod/registry/registry.schema';

export interface RegistryInfo {
    id: string;
    name: string;
    url: string;
    username: string | null;
    createdAt: Date;
}

export async function getRegistryById(id: string) {
    return prisma.dockerRegistry.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            url: true,
            username: true,
            password: true,
            createdAt: true,
        },
    });
}

export async function getRegistries(): Promise<RegistryInfo[]> {
    try {
        return prisma.dockerRegistry.findMany({
            select: {
                id: true,
                name: true,
                url: true,
                username: true,
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
        return prisma.dockerRegistry.create({
            data: {
                name: data.name,
                url: data.url,
                username: data.username || null,
                password: data.password ? encrypt(data.password) : null,
            },
            select: {
                id: true,
                name: true,
                url: true,
                username: true,
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
                createdAt: true,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update registry');
    }
}

export async function deleteRegistry(id: string): Promise<void> {
    try {
        await prisma.dockerRegistry.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error('Failed to delete registry');
    }
}

export async function getRegistryWithPassword(id: string) {
    try {
        const registry = await prisma.dockerRegistry.findUnique({
            where: { id },
            select: { id: true, name: true, url: true, username: true, password: true },
        });

        if (!registry) return null;

        return {
            ...registry,
            password: registry.password ? decrypt(registry.password) : null,
        };
    } catch (error: unknown) {
        throw new Error('Failed to retrieve registry with password');
    }
}
