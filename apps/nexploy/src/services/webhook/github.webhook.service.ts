import crypto from 'crypto';
import { extractGitHubRepo } from '@/services/git/git.service';
import { getTokenStorage } from '@/lib/storage/token-storage';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';

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

export async function createGitHubWebhook(
    repositoryUrl: string,
    userId: string,
    webhookUrl: string,
): Promise<{ webhookId: string; webhookSecret: string }> {
    const { owner, repo } = extractGitHubRepo(repositoryUrl);

    const token = getTokenStorage();

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token.accessToken}`,
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
