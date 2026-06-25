import { GitProviderType } from 'generated/client';
import { prisma } from '../../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export interface GitProviderInfo {
    id: string;
    provider: GitProviderType;
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
    appName?: string;
    baseUrl?: string;
}

export async function getAllGitProviders(): Promise<GitProviderInfo[]> {
    const t = await getErrorTranslator();
    try {
        const records = await prisma.gitProvider.findMany({
            where: { enabled: true },
            select: {
                id: true,
                provider: true,
                displayName: true,
                clientId: true,
                appName: true,
                ownerName: true,
                ownerType: true,
                baseUrl: true,
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
                    provider: record.provider,
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
        throw new Error(t('oauthProvider.getProvidersFailed'));
    }
}

export async function getGitProviderCredentials(
    provider: GitProviderType,
    gitAccountId?: string,
): Promise<GitProviderCredentials | null> {
    const t = await getErrorTranslator();
    try {
        if (gitAccountId) {
            const gitAccount = await prisma.gitAccount.findUnique({
                where: { id: gitAccountId },
                select: { gitProviderId: true },
            });
            if (!gitAccount) return null;
            return getGitProviderCredentialsById(gitAccount.gitProviderId);
        }

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
            appName: record.appName ?? undefined,
            baseUrl: record.baseUrl ?? undefined,
        };
    } catch (error: unknown) {
        throw new Error(t('oauthProvider.getCredentialsFailed'));
    }
}

async function getGitProviderCredentialsById(id: string): Promise<GitProviderCredentials | null> {
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
        appName: record.appName ?? undefined,
        baseUrl: record.baseUrl ?? undefined,
    };
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
    const t = await getErrorTranslator();
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'GITHUB',
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
        throw new Error(t('oauthProvider.saveGithubAppFailed'));
    }
}

export async function saveGitLabProvider(
    displayName: string,
    clientId: string,
    clientSecret: string,
    baseUrl?: string | null,
): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'GITLAB',
                displayName,
                clientId: encrypt(clientId),
                clientSecret: encrypt(clientSecret),
                baseUrl: baseUrl || 'https://gitlab.com',
            },
        });
    } catch (error: unknown) {
        throw new Error(t('oauthProvider.saveGitlabFailed'));
    }
}

export async function saveGiteaProvider(
    displayName: string,
    clientId: string,
    clientSecret: string,
    baseUrl: string,
): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'GITEA',
                displayName,
                clientId: encrypt(clientId),
                clientSecret: encrypt(clientSecret),
                baseUrl,
            },
        });
    } catch (error: unknown) {
        throw new Error(t('oauthProvider.saveGiteaFailed'));
    }
}

export async function deleteGitProvider(id: string) {
    const t = await getErrorTranslator();
    try {
        return await prisma.gitProvider.delete({
            where: { id },
        });
    } catch (error: unknown) {
        throw new Error(t('oauthProvider.deleteProviderFailed'));
    }
}
