import { prisma } from '../../prisma/prisma';
import crypto from 'crypto';
import { WebhookConfig } from '@workspace/schemas-zod/repository/webhook.schema';

interface WebhookPayload {
    repositoryUrl: string;
    branch: string;
    commitHash?: string;
    commitMessage?: string;
}

function extractGitLabProjectId(repositoryUrl: string): string {
    const match = repositoryUrl.match(/gitlab\.com[\/:](.+?)(\.git)?$/);
    if (match && match[1]) {
        return encodeURIComponent(match[1].replace('.git', ''));
    }
    throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
}

function extractGitHubRepo(repositoryUrl: string): { owner: string; repo: string } {
    const match = repositoryUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
}

export async function createGitLabWebhook(
    repositoryUrl: string,
    accessToken: string,
    userId: string,
    webhookUrl: string,
): Promise<{ webhookId: string; webhookSecret: string }> {
    const projectId = extractGitLabProjectId(repositoryUrl);

    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: webhookUrl,
            push_events: true,
            token: userId,
            enable_ssl_verification: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create GitLab webhook: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return { webhookId: String(data.id), webhookSecret: userId };
}

export async function deleteGitLabWebhook(
    repositoryUrl: string,
    accessToken: string,
    webhookId: string,
): Promise<void> {
    const projectId = extractGitLabProjectId(repositoryUrl);

    const response = await fetch(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks/${webhookId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete GitLab webhook: ${response.status} - ${error}`);
    }
}

export async function createGitHubWebhook(
    repositoryUrl: string,
    accessToken: string,
    userId: string,
    webhookUrl: string,
): Promise<{ webhookId: string; webhookSecret: string }> {
    const { owner, repo } = extractGitHubRepo(repositoryUrl);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push'],
            config: {
                url: webhookUrl,
                content_type: 'json',
                insecure_ssl: '0',
                secret: userId,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create GitHub webhook: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return { webhookId: String(data.id), webhookSecret: userId };
}

export async function deleteGitHubWebhook(
    repositoryUrl: string,
    accessToken: string,
    webhookId: string,
): Promise<void> {
    const { owner, repo } = extractGitHubRepo(repositoryUrl);

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        },
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete GitHub webhook: ${response.status} - ${error}`);
    }
}

export async function setupWebhookForRepository(
    repositoryUrl: string,
    gitProvider: string,
    accessToken: string,
    userId: string,
    baseUrl: string,
): Promise<WebhookConfig> {
    const webhookUrl = `${baseUrl}/api/webhooks/${gitProvider}`;

    let result: WebhookConfig;

    if (gitProvider === 'gitlab') {
        result = await createGitLabWebhook(repositoryUrl, accessToken, userId, webhookUrl);
    } else if (gitProvider === 'github') {
        result = await createGitHubWebhook(repositoryUrl, accessToken, userId, webhookUrl);
    } else {
        throw new Error(`Unsupported git provider: ${gitProvider}`);
    }

    return result;
}

export async function removeWebhookForRepository(
    repositoryId: string,
    accessToken: string,
): Promise<void> {
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
            await deleteGitLabWebhook(repository.repositoryUrl, accessToken, repository.webhookId);
        } else if (repository.gitProvider === 'github') {
            await deleteGitHubWebhook(repository.repositoryUrl, accessToken, repository.webhookId);
        }
    } catch (error) {
        console.error('Failed to delete webhook:', error);
    }

    await prisma.repository.update({
        where: { id: repositoryId },
        data: {
            webhookId: null,
            webhookSecret: null,
        },
    });
}

export function verifyGitLabWebhookToken(token: string | null, secret: string): boolean {
    if (!token || !secret) return false;
    return token === secret;
}

export function verifyGitHubSignature(
    payload: string,
    signature: string | null,
    secret: string,
): boolean {
    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
}

export function parseGitHubWebhook(payload: any): WebhookPayload | null {
    if (!payload.ref?.startsWith('refs/heads/')) {
        return null;
    }

    return {
        repositoryUrl: payload.repository?.clone_url || payload.repository?.html_url,
        branch: payload.ref.replace('refs/heads/', ''),
        commitHash: payload.head_commit?.id?.substring(0, 8),
        commitMessage: payload.head_commit?.message,
    };
}

export function parseGitLabWebhook(payload: any): WebhookPayload | null {
    if (payload.object_kind !== 'push' || !payload.ref?.startsWith('refs/heads/')) {
        return null;
    }

    const lastCommit = payload.commits?.[payload.commits.length - 1];

    return {
        repositoryUrl: payload.project?.git_http_url || payload.project?.http_url,
        branch: payload.ref.replace('refs/heads/', ''),
        commitHash: lastCommit?.id?.substring(0, 8),
        commitMessage: lastCommit?.message,
    };
}

export async function findRepositoryByWebhook(
    repositoryUrl: string,
): Promise<{ id: string; webhookSecret: string | null } | null> {
    const repositories = await prisma.repository.findUnique({
        where: {
            repositoryUrl,
        },
        select: {
            id: true,
            repositoryUrl: true,
            webhookSecret: true,
        },
    });
    if (!repositories) return null;

    return { id: repositories.id, webhookSecret: repositories.webhookSecret };
}
