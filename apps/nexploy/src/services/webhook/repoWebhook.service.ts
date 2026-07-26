import crypto from 'crypto';
import { prisma } from '../../../prisma/prisma';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';
import { getGitAdapter } from '@/services/git/core/registry';
import { encrypt } from '@/lib/encryption';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export type WebhookSetupResult = { configured: true } | { configured: false; error: string };

const repoWebhookSelect = {
    id: true,
    name: true,
    gitProvider: true,
    gitId: true,
    gitAccountId: true,
    webhookId: true,
    gitAccount: {
        select: {
            userId: true,
            gitProvider: { select: { baseUrl: true } },
        },
    },
} as const;

export async function setupRepositoryWebhook(
    repositoryId: string,
    baseUrl: string,
    options: { refresh?: boolean } = {},
): Promise<WebhookSetupResult> {
    const t = await getErrorTranslator();
    const repo = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: repoWebhookSelect,
    });

    if (!repo) throw new Error(t('webhook.repositoryNotFound'));

    if (repo.webhookId && !options.refresh) {
        return { configured: true };
    }

    if (repo.webhookId) {
        await teardownRepositoryWebhook(repositoryId);
    }

    const tokenOwnerId = repo.gitAccount?.userId;
    if (!repo.gitAccountId || !tokenOwnerId) {
        throw new Error(t('git.noAccessToken', { provider: repo.gitProvider }));
    }

    const adapter = getGitAdapter(repo.gitProvider);
    const webhookUrl = `${baseUrl}${adapter.webhookPath}`;
    const secret = crypto.randomUUID();

    try {
        const oldToken = await getGitProviderToken(repo.gitProvider, {
            gitAccountId: repo.gitAccountId,
            requestedUserId: tokenOwnerId,
        });
        const token = await getValidToken(
            oldToken,
            repo.gitProvider,
            tokenOwnerId,
            repo.gitAccountId,
        );

        const webhookId = await adapter.createWebhook({
            token,
            baseUrl: repo.gitAccount?.gitProvider?.baseUrl ?? '',
            repo: { gitId: repo.gitId, fullName: repo.name },
            webhookUrl,
            secret,
        });

        await prisma.repository.update({
            where: { id: repositoryId },
            data: { webhookId, webhookSecret: encrypt(secret) },
        });

        return { configured: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error(t('webhook.unknownError'));
    }
}

export async function teardownRepositoryWebhook(repositoryId: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const repo = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: repoWebhookSelect,
        });

        if (!repo) return;

        const tokenOwnerId = repo.gitAccount?.userId;

        if (repo.webhookId && repo.gitAccountId && tokenOwnerId) {
            try {
                const oldToken = await getGitProviderToken(repo.gitProvider, {
                    gitAccountId: repo.gitAccountId,
                    requestedUserId: tokenOwnerId,
                });
                const token = await getValidToken(
                    oldToken,
                    repo.gitProvider,
                    tokenOwnerId,
                    repo.gitAccountId,
                );

                await getGitAdapter(repo.gitProvider).deleteWebhook({
                    token,
                    baseUrl: repo.gitAccount?.gitProvider?.baseUrl ?? '',
                    repo: { gitId: repo.gitId, fullName: repo.name },
                    webhookId: repo.webhookId,
                });
            } catch {}
        }

        await prisma.repository.update({
            where: { id: repositoryId },
            data: { webhookId: null, webhookSecret: null },
        });
    } catch {
        throw new Error(t('webhook.teardownFailed'));
    }
}
