import { drinoGitlab } from '@/lib/api/drinoGitlab';
import { WebhookPayload } from '@workspace/typescript-interface/webhook';

export function extractGitLabProjectId(repositoryUrl: string): string {
    const match = repositoryUrl.match(/gitlab\.com[\/:](.+?)(\.git)?$/);
    if (match && match[1]) {
        return encodeURIComponent(match[1].replace('.git', ''));
    }
    throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
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

export function verifyGitLabWebhookToken(token: string | null, secret: string): boolean {
    if (!token || !secret) return false;
    return token === secret;
}

export async function createGitLabWebhook(
    repositoryUrl: string,
    userId: string,
    webhookUrl: string,
): Promise<{ webhookId: string; webhookSecret: string }> {
    const projectId = extractGitLabProjectId(repositoryUrl);

    try {
        const data = await drinoGitlab
            .post<{ id: number }>(`/v4/projects/${projectId}/hooks`, {
                url: webhookUrl,
                push_events: true,
                token: userId,
                enable_ssl_verification: true,
            })
            .consume();

        return { webhookId: String(data.id), webhookSecret: userId };
    } catch (error: any) {
        throw new Error(`Failed to create GitLab webhook: ${error.response?.status} - ${error}`);
    }
}
