import crypto from 'crypto';
import { extractGitHubRepo } from '@/services/git/git.service';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';
import { githubCreateWebhook } from '@/lib/api/github.api';

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

    const data = await githubCreateWebhook(owner, repo, webhookUrl, userId);

    return { webhookId: String(data.id), webhookSecret: userId };
}
