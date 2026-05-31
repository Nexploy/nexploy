import crypto from 'crypto';
import { prisma } from '../../../prisma/prisma';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { getGitProviderToken } from '@/services/git/git.service';
import { getValidToken } from '@/services/api/gitProvider.service';
import { githubCreateWebhook, githubDeleteWebhook } from '@/lib/api/github.api';
import { gitlabCreateWebhook, gitlabDeleteWebhook } from '@/lib/api/gitlab.api';
import { encrypt } from '@/lib/encryption';

function getWebhookUrl(baseUrl: string, provider: string): string {
    if (provider === 'github') return `${baseUrl}/api/webhooks/github`;
    if (provider === 'gitlab') return `${baseUrl}/api/webhooks/gitlab`;
    throw new Error(`Unsupported git provider: ${provider}`);
}

export type WebhookSetupResult = { configured: true } | { configured: false; error: string };

export async function setupRepositoryWebhook(
    repositoryId: string,
    baseUrl: string,
): Promise<WebhookSetupResult> {
    const repo = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: {
            id: true,
            name: true,
            gitProvider: true,
            gitId: true,
            gitAccountId: true,
            webhookId: true,
            userId: true,
            gitAccount: {
                select: {
                    gitProvider: { select: { baseUrl: true } },
                },
            },
        },
    });

    if (!repo) throw new Error('Repository not found');

    if (repo.webhookId) {
        return { configured: true };
    }

    const webhookUrl = getWebhookUrl(baseUrl, repo.gitProvider);
    const secret = crypto.randomUUID();

    try {
        const oldToken = await getGitProviderToken(repo.gitProvider, {
            gitAccountId: repo.gitAccountId ?? undefined,
            requestedUserId: repo.userId,
        });
        const token = await getValidToken(
            oldToken,
            repo.gitProvider,
            repo.userId,
            repo.gitAccountId ?? undefined,
        );

        let webhookId: string | undefined;

        await tokenGitStorage.run(token, async () => {
            if (repo.gitProvider === 'GITHUB') {
                const [owner, repoName] = repo.name.split('/');
                if (!owner || !repoName) throw new Error(`Invalid repository name: ${repo.name}`);
                const result = await githubCreateWebhook(owner, repoName, webhookUrl, secret);
                webhookId = String(result.id);
            } else if (repo.gitProvider === 'GITLAB') {
                const gitlabBase = repo.gitAccount?.gitProvider?.baseUrl as string;
                const result = await gitlabCreateWebhook(
                    gitlabBase,
                    repo.gitId,
                    webhookUrl,
                    secret,
                );
                webhookId = String(result.id);
            }
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
        throw new Error('Unknown error');
    }
}

export async function teardownRepositoryWebhook(repositoryId: string): Promise<void> {
    try {
        const repo = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: {
                id: true,
                name: true,
                gitProvider: true,
                gitId: true,
                gitAccountId: true,
                webhookId: true,
                userId: true,
                gitAccount: {
                    select: {
                        gitProvider: { select: { baseUrl: true } },
                    },
                },
            },
        });

        if (!repo) return;

        if (repo.webhookId) {
            try {
                const oldToken = await getGitProviderToken(repo.gitProvider, {
                    gitAccountId: repo.gitAccountId ?? undefined,
                    requestedUserId: repo.userId,
                });
                const token = await getValidToken(
                    oldToken,
                    repo.gitProvider,
                    repo.userId,
                    repo.gitAccountId ?? undefined,
                );

                await tokenGitStorage.run(token, async () => {
                    if (repo.gitProvider === 'GITHUB') {
                        const [owner, repoName] = repo.name.split('/');
                        if (!owner || !repoName)
                            throw new Error(`Invalid repository name: ${repo.name}`);
                        await githubDeleteWebhook(owner, repoName, repo.webhookId!);
                    } else if (repo.gitProvider === 'GITLAB') {
                        const gitlabBase =
                            repo.gitAccount?.gitProvider?.baseUrl ?? 'https://gitlab.com';
                        await gitlabDeleteWebhook(gitlabBase, repo.gitId, repo.webhookId!);
                    }
                });
            } catch {}
        }

        await prisma.repository.update({
            where: { id: repositoryId },
            data: { webhookId: null, webhookSecret: null },
        });
    } catch {
        throw new Error('Failed to teardown repository webhook');
    }
}
