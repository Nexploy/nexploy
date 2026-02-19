import { WebhookConfig } from '@workspace/typescript-interface/websocket';
import { kyGitlab } from '@/lib/api/kyGitlab';
import {
    createGitLabWebhook,
    extractGitLabProjectId,
} from '@/services/webhook/gitlab.webhook.service';
import { createGitHubWebhook } from '@/services/webhook/github.webhook.service';
import { prisma } from '../../../prisma/prisma';
import { extractGitHubRepo } from '@/services/git/git.service';
import { deleteWebhookForRepository } from '@/services/repository.service';
import { githubDeleteWebhook } from '@/lib/api/github.api';

export async function setupWebhookForRepository(
    repositoryUrl: string,
    gitProvider: string,
    userId: string,
    baseUrl: string,
): Promise<WebhookConfig> {
    const webhookUrl = `${baseUrl}/api/webhooks/${gitProvider}`;

    let result: WebhookConfig;

    if (gitProvider === 'github') {
        result = await createGitHubWebhook(repositoryUrl, userId, webhookUrl);
    } else if (gitProvider === 'gitlab') {
        result = await createGitLabWebhook(repositoryUrl, userId, webhookUrl);
    } else {
        throw new Error(`Unsupported git provider: ${gitProvider}`);
    }

    return result;
}

export async function removeWebhookForRepository(repositoryId: string): Promise<void> {
    const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        include: {
            user: {
                include: {
                    accounts: true,
                },
            },
        },
    });

    if (!repository || !repository.webhookId) return;

    try {
        if (repository.gitProvider === 'gitlab') {
            const projectId = extractGitLabProjectId(repository.repositoryUrl);

            await kyGitlab.delete(`v4/projects/${projectId}/hooks/${repository.webhookId}`).json();
        } else if (repository.gitProvider === 'github') {
            const { owner, repo } = extractGitHubRepo(repository.repositoryUrl);

            await githubDeleteWebhook(owner, repo, repository.webhookId);
        }
    } catch (error: unknown) {
        throw new Error('Failed to delete webhook');
    }

    await deleteWebhookForRepository(repositoryId);
}

export async function findRepositoryByWebhook(
    repositoryUrl: string,
): Promise<{ id: string; webhookSecret: string | null; environmentId: string | null } | null> {
    const repositories = await prisma.repository.findUnique({
        where: {
            repositoryUrl,
        },
        select: {
            id: true,
            repositoryUrl: true,
            webhookSecret: true,
            environmentId: true,
        },
    });
    if (!repositories) return null;

    return {
        id: repositories.id,
        webhookSecret: repositories.webhookSecret,
        environmentId: repositories.environmentId,
    };
}
