import { WebhookConfig } from '@workspace/schemas-zod/repository/webhook.schema';
import { drinoGitlab } from '@/lib/api/drinoGitlab';
import { drinoGithub } from '@/lib/api/drinoGithub';
import {
    createGitLabWebhook,
    extractGitLabProjectId,
} from '@/services/webhook/gitlab.webhook.service';
import { createGitHubWebhook } from '@/services/webhook/github.webhook.service';
import { prisma } from '../../../prisma/prisma';
import { extractGitHubRepo } from '@/services/git/git.service';
import { deleteWebhookForRepository } from '@/services/repository.service';

export async function setupWebhookForRepository(
    repositoryUrl: string,
    gitProvider: string,
    userId: string,
    baseUrl: string,
): Promise<WebhookConfig> {
    const webhookUrl = `${baseUrl}/api/webhooks/${gitProvider}`;

    let result: WebhookConfig;

    if (gitProvider === 'gitlab') {
        result = await createGitLabWebhook(repositoryUrl, userId, webhookUrl);
    } else if (gitProvider === 'github') {
        result = await createGitHubWebhook(repositoryUrl, userId, webhookUrl);
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

            await drinoGitlab
                .delete(`/v4/projects/${projectId}/hooks/${repository.webhookId}`)
                .consume();
        } else if (repository.gitProvider === 'github') {
            const { owner, repo } = extractGitHubRepo(repository.repositoryUrl);

            await drinoGithub
                .delete(`/repos/${owner}/${repo}/hooks/${repository.webhookId}`)
                .consume();
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
