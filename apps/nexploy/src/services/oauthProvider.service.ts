import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';

export interface GitProviderInfo {
    id: string;
    displayName: string;
    isConfigured: boolean;
    appName?: string;
    ownerName?: string;
    ownerType?: string;
    maskedClientId?: string;
    baseUrl?: string;
}

export interface GitProviderCredentials {
    clientId: string;
    clientSecret: string;
    privateKey?: string;
    appId?: string;
    baseUrl?: string;
}

export async function getGitProvidersByType(provider: string): Promise<GitProviderInfo[]> {
    try {
        const records = await prisma.gitProvider.findMany({
            where: { provider, enabled: true },
            select: {
                id: true,
                displayName: true,
                clientId: true,
                appName: true,
                ownerName: true,
                ownerType: true,
                baseUrl: true,
                enabled: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return records
            .filter((r) => r.clientId)
            .map((record) => {
                const decryptedClientId = decrypt(record.clientId!);
                const masked =
                    decryptedClientId.length > 8
                        ? decryptedClientId.slice(0, 4) + '...' + decryptedClientId.slice(-4)
                        : '****';

                return {
                    id: record.id,
                    displayName: record.displayName,
                    isConfigured: true,
                    appName: record.appName ?? undefined,
                    ownerName: record.ownerName ?? undefined,
                    ownerType: record.ownerType ?? undefined,
                    maskedClientId: masked,
                    baseUrl: record.baseUrl ?? undefined,
                };
            });
    } catch (error: unknown) {
        throw new Error('Failed to get git providers');
    }
}

export async function getAllGitProviders(): Promise<{
    github: GitProviderInfo[];
    gitlab: GitProviderInfo[];
}> {
    try {
        const [github, gitlab] = await Promise.all([
            getGitProvidersByType('github'),
            getGitProvidersByType('gitlab'),
        ]);
        return { github, gitlab };
    } catch (error: unknown) {
        throw new Error('Failed to get git providers');
    }
}

export async function getGitProviderCredentials(
    provider: string,
): Promise<GitProviderCredentials | null> {
    try {
        const record = await prisma.gitProvider.findFirst({
            where: { provider, enabled: true },
            orderBy: { createdAt: 'asc' },
        });

        if (!record || !record.clientId || !record.clientSecret) {
            return null;
        }

        return {
            clientId: decrypt(record.clientId),
            clientSecret: decrypt(record.clientSecret),
            privateKey: record.privateKey ? decrypt(record.privateKey) : undefined,
            appId: record.appId ?? undefined,
            baseUrl: record.baseUrl ?? undefined,
        };
    } catch (error: unknown) {
        throw new Error('Failed to get git provider credentials');
    }
}

export async function getGitProviderCredentialsById(
    id: string,
): Promise<GitProviderCredentials | null> {
    try {
        const record = await prisma.gitProvider.findUnique({
            where: { id, enabled: true },
        });

        if (!record || !record.clientId || !record.clientSecret) {
            return null;
        }

        return {
            clientId: decrypt(record.clientId),
            clientSecret: decrypt(record.clientSecret),
            privateKey: record.privateKey ? decrypt(record.privateKey) : undefined,
            appId: record.appId ?? undefined,
            baseUrl: record.baseUrl ?? undefined,
        };
    } catch (error: unknown) {
        throw new Error('Failed to get git provider credentials');
    }
}

export async function getGitProviderCredentialsByAccountId(
    gitAccountId: string,
): Promise<GitProviderCredentials | null> {
    try {
        const gitAccount = await prisma.gitAccount.findUnique({
            where: { id: gitAccountId },
            select: { gitProviderId: true },
        });

        if (!gitAccount) return null;
        return getGitProviderCredentialsById(gitAccount.gitProviderId);
    } catch (error: unknown) {
        throw new Error('Failed to get git provider credentials');
    }
}

export async function saveGitHubApp(data: {
    displayName: string;
    appId: string;
    appName: string;
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
    privateKey: string;
    ownerName?: string;
    ownerType?: string;
}): Promise<void> {
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'github',
                displayName: data.displayName,
                appId: data.appId,
                appName: data.appName,
                ownerName: data.ownerName,
                ownerType: data.ownerType,
                clientId: encrypt(data.clientId),
                clientSecret: encrypt(data.clientSecret),
                privateKey: encrypt(data.privateKey),
                baseUrl: 'https://github.com',
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to save GitHub App');
    }
}

export async function saveGitLabProvider(
    displayName: string,
    clientId: string,
    clientSecret: string,
    baseUrl?: string | null,
): Promise<void> {
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'gitlab',
                displayName,
                clientId: encrypt(clientId),
                clientSecret: encrypt(clientSecret),
                baseUrl: baseUrl || 'https://gitlab.com',
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to save GitLab provider');
    }
}

export async function deleteGitProvider(id: string) {
    try {
        return await prisma.gitProvider.delete({
            where: { id },
        });
    } catch (error: unknown) {
        throw new Error('Failed to delete git provider');
    }
}
