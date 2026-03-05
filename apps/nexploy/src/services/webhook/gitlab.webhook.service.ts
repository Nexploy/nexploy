import { WebhookPayload } from '@workspace/typescript-interface/webhook';
import { kyGitlab } from '@/lib/api/kyGitlab';

export function extractGitLabProjectId(repositoryUrl: string): string {
    try {
        const url = new URL(repositoryUrl);
        const path = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
        return encodeURIComponent(path);
    } catch {
        throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }
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
    const baseUrl = new URL(repositoryUrl).origin;

    try {
        const data = await kyGitlab(baseUrl)
            .post(`v4/projects/${projectId}/hooks`, {
                json: {
                    url: webhookUrl,
                    push_events: true,
                    token: userId,
                    enable_ssl_verification: true,
                },
            })
            .json<{ id: number }>();

        return { webhookId: String(data.id), webhookSecret: userId };
    } catch (error: any) {
        throw new Error(`Failed to create GitLab webhook: ${error.response?.status} - ${error}`);
    }
}
