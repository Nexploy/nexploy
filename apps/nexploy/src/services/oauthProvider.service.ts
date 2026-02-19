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
}

export interface GitProviderCredentials {
    clientId: string;
    clientSecret: string;
    privateKey?: string;
    appId?: string;
}

export async function getGitProvidersByType(provider: string): Promise<GitProviderInfo[]> {
    const records = await prisma.gitProvider.findMany({
        where: { provider, enabled: true },
        select: {
            id: true,
            displayName: true,
            clientId: true,
            appName: true,
            ownerName: true,
            ownerType: true,
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
            };
        });
}

export async function getGitProviderInfo(id: string): Promise<GitProviderInfo | null> {
    const record = await prisma.gitProvider.findUnique({
        where: { id },
        select: { id: true, displayName: true, clientId: true, appName: true, enabled: true },
    });

    if (!record || !record.enabled || !record.clientId) {
        return null;
    }

    const decryptedClientId = decrypt(record.clientId);
    const masked =
        decryptedClientId.length > 8
            ? decryptedClientId.slice(0, 4) + '...' + decryptedClientId.slice(-4)
            : '****';

    return {
        id: record.id,
        displayName: record.displayName,
        isConfigured: true,
        appName: record.appName ?? undefined,
        maskedClientId: masked,
    };
}

export async function getAllGitProviders(): Promise<{
    github: GitProviderInfo[];
    gitlab: GitProviderInfo[];
}> {
    const [github, gitlab] = await Promise.all([
        getGitProvidersByType('github'),
        getGitProvidersByType('gitlab'),
    ]);
    return { github, gitlab };
}

export async function getGitProviderCredentials(
    provider: string,
): Promise<GitProviderCredentials | null> {
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
    };
}

export async function getGitProviderCredentialsById(
    id: string,
): Promise<GitProviderCredentials | null> {
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
    };
}

export async function getGitProviderCredentialsByAccountId(
    gitAccountId: string,
): Promise<GitProviderCredentials | null> {
    const gitAccount = await prisma.gitAccount.findUnique({
        where: { id: gitAccountId },
        select: { gitProviderId: true },
    });

    if (!gitAccount) return null;
    return getGitProviderCredentialsById(gitAccount.gitProviderId);
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
            webhookSecret: encrypt(data.webhookSecret),
            privateKey: encrypt(data.privateKey),
        },
    });
}

export async function saveGitLabProvider(
    displayName: string,
    clientId: string,
    clientSecret: string,
): Promise<void> {
    await prisma.gitProvider.create({
        data: {
            provider: 'gitlab',
            displayName,
            clientId: encrypt(clientId),
            clientSecret: encrypt(clientSecret),
        },
    });
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
