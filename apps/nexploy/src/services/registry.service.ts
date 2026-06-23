import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import type { CreateRegistryInput, UpdateRegistryInput, } from '@workspace/schemas-zod/registry/registry.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

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
    const t = await getErrorTranslator();
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
        throw new Error(t('registry.getFailed'));
    }
}

export async function createRegistry(data: CreateRegistryInput): Promise<RegistryInfo> {
    const t = await getErrorTranslator();
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
        throw new Error(t('registry.createFailed'));
    }
}

export async function updateRegistry(data: UpdateRegistryInput): Promise<RegistryInfo> {
    const t = await getErrorTranslator();
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
        throw new Error(t('registry.updateFailed'));
    }
}

export async function deleteRegistry(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.dockerRegistry.delete({ where: { id } });
    } catch (error: unknown) {
        throw new Error(t('registry.deleteFailed'));
    }
}

export async function getRegistryWithPassword(id: string) {
    const t = await getErrorTranslator();
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
        throw new Error(t('registry.retrieveWithPasswordFailed'));
    }
}
